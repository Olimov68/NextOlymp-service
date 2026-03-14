package devices

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
)

type Handler struct {
	sessionMgr *utils.SessionManager
}

func NewHandler(sessionMgr *utils.SessionManager) *Handler {
	return &Handler{sessionMgr: sessionMgr}
}

// SessionResponse — sessiya javob formati
type SessionResponse struct {
	ID           uint   `json:"id"`
	DeviceName   string `json:"device_name"`
	Browser      string `json:"browser"`
	OS           string `json:"os"`
	DeviceType   string `json:"device_type"`
	IPAddress    string `json:"ip_address"`
	Location     string `json:"location"`
	IsActive     bool   `json:"is_active"`
	IsCurrent    bool   `json:"is_current"`
	LastActiveAt string `json:"last_active_at"`
	CreatedAt    string `json:"created_at"`
}

// List — foydalanuvchi qurilmalari ro'yxati
func (h *Handler) List(c *gin.Context) {
	userID := c.GetUint("userID")
	currentSessionID := c.GetUint("sessionID")

	sessions := h.sessionMgr.GetUserSessions(userID)

	result := make([]SessionResponse, 0, len(sessions))
	for _, s := range sessions {
		result = append(result, SessionResponse{
			ID:           s.ID,
			DeviceName:   s.DeviceName,
			Browser:      s.Browser,
			OS:           s.OS,
			DeviceType:   s.DeviceType,
			IPAddress:    s.IPAddress,
			Location:     s.Location,
			IsActive:     s.IsActive,
			IsCurrent:    s.ID == currentSessionID,
			LastActiveAt: s.LastActiveAt.Format("2006-01-02T15:04:05Z"),
			CreatedAt:    s.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	response.Success(c, http.StatusOK, "Qurilmalar ro'yxati", gin.H{
		"devices": result,
		"total":   len(result),
	})
}

// GetCurrent — hozirgi qurilma ma'lumotlari
func (h *Handler) GetCurrent(c *gin.Context) {
	userID := c.GetUint("userID")
	currentSessionID := c.GetUint("sessionID")

	sessions := h.sessionMgr.GetActiveSessions(userID)

	for _, s := range sessions {
		if s.ID == currentSessionID {
			response.Success(c, http.StatusOK, "Hozirgi qurilma", SessionResponse{
				ID:           s.ID,
				DeviceName:   s.DeviceName,
				Browser:      s.Browser,
				OS:           s.OS,
				DeviceType:   s.DeviceType,
				IPAddress:    s.IPAddress,
				Location:     s.Location,
				IsActive:     s.IsActive,
				IsCurrent:    true,
				LastActiveAt: s.LastActiveAt.Format("2006-01-02T15:04:05Z"),
				CreatedAt:    s.CreatedAt.Format("2006-01-02T15:04:05Z"),
			})
			return
		}
	}

	response.Error(c, http.StatusNotFound, "Joriy sessiya topilmadi", nil)
}

// LogoutDevice — bitta qurilmani chiqarish
func (h *Handler) LogoutDevice(c *gin.Context) {
	userID := c.GetUint("userID")
	currentSessionID := c.GetUint("sessionID")

	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri sessiya ID", nil)
		return
	}

	if uint(sessionID) == currentSessionID {
		response.Error(c, http.StatusBadRequest, "Joriy sessiyani bu yerdan chiqara olmaysiz. /auth/logout dan foydalaning", nil)
		return
	}

	if err := h.sessionMgr.InvalidateSession(uint(sessionID), userID); err != nil {
		response.Error(c, http.StatusNotFound, "Sessiya topilmadi", nil)
		return
	}

	response.Success(c, http.StatusOK, "Qurilma chiqarildi", nil)
}

// LogoutAllOthers — joriydan boshqa barcha qurilmalarni chiqarish
func (h *Handler) LogoutAllOthers(c *gin.Context) {
	userID := c.GetUint("userID")
	currentSessionID := c.GetUint("sessionID")

	count := h.sessionMgr.InvalidateAllOtherSessions(currentSessionID, userID)

	response.Success(c, http.StatusOK, "Boshqa qurilmalar chiqarildi", gin.H{
		"logged_out_count": count,
	})
}

// LogoutAll — barcha qurilmalarni chiqarish (joriy ham)
func (h *Handler) LogoutAll(c *gin.Context) {
	userID := c.GetUint("userID")

	h.sessionMgr.InvalidateAllSessions(userID)

	response.Success(c, http.StatusOK, "Barcha qurilmalar chiqarildi", nil)
}
