package panelauth

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/middleware"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	service *Service
	db      *gorm.DB
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// SetDB — audit logging uchun db ni o'rnatish
func (h *Handler) SetDB(db *gorm.DB) {
	h.db = db
}

// Login — admin yoki superadmin login
// POST /api/v1/panel/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	res, err := h.service.Login(&req)
	if err != nil {
		// Muvaffaqiyatsiz panel login urinishi
		if h.db != nil {
			utils.LogSystemAudit(h.db, c, "panel_login_failed", "panel_auth",
				fmt.Sprintf("Panel login urinishi muvaffaqiyatsiz: %s — %s", req.Username, err.Error()))
		}
		response.Error(c, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	// Audit log — muvaffaqiyatli panel login
	if h.db != nil && res != nil {
		utils.LogAudit(h.db, c, "panel_login", "panel_auth", nil,
			fmt.Sprintf("Admin tizimga kirdi: %s (role: %s)", res.Staff.Username, res.Staff.Role))
		// staffID va staffRole ni context ga qo'yamiz audit uchun
		c.Set("staffID", res.Staff.ID)
		c.Set("staffRole", res.Staff.Role)
	}

	response.Success(c, http.StatusOK, "Login successful", res)
}

// RefreshToken — token yangilash
// POST /api/v1/panel/auth/refresh
func (h *Handler) RefreshToken(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	tokens, err := h.service.RefreshTokens(req.RefreshToken)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Token refreshed", tokens)
}

// Me — joriy panel foydalanuvchi ma'lumotlari
// GET /api/v1/panel/auth/me
func (h *Handler) Me(c *gin.Context) {
	staffID, exists := c.Get("staffID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	res, err := h.service.GetMe(staffID.(uint))
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Staff info", res)
}

// Permissions — joriy foydalanuvchi ruxsatlari
// GET /api/v1/panel/auth/permissions
func (h *Handler) Permissions(c *gin.Context) {
	staffID, exists := c.Get("staffID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	role, _ := c.Get("staffRole")
	roleStr, _ := role.(string)

	permissions := middleware.GetStaffPermissionCodes(h.service.repo.GetDB(), staffID.(uint), roleStr)

	response.Success(c, http.StatusOK, "Permissions", gin.H{
		"permissions": permissions,
	})
}

// Logout — panel logout (frontend tokenni o'chiradi)
// POST /api/v1/panel/auth/logout
func (h *Handler) Logout(c *gin.Context) {
	// Audit log — panel logout
	if h.db != nil {
		staffID, _ := c.Get("staffID")
		sid, _ := staffID.(uint)
		if sid > 0 {
			utils.LogAudit(h.db, c, "panel_logout", "panel_auth", nil, "Admin tizimdan chiqdi")
		}
	}

	response.Success(c, http.StatusOK, "Logged out", nil)
}
