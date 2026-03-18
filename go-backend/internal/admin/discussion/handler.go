package admindiscussion

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// ListMessages — barcha xabarlar (admin)
func (h *Handler) ListMessages(c *gin.Context) {
	var params ListMessagesParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 50
	}

	list, total, err := h.repo.ListMessages(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]AdminMessageResponse, len(list))
	for i := range list {
		items[i] = toAdminMessageResponse(&list[i])
	}

	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	response.Success(c, http.StatusOK, "Discussion messages", gin.H{
		"items": items,
		"pagination": gin.H{
			"page":        params.Page,
			"page_size":   params.PageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// DeleteMessage — xabarni o'chirish
func (h *Handler) DeleteMessage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if err := h.repo.DeleteMessage(uint(id)); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Xabar o'chirildi", nil)
}

// HideMessage — xabarni yashirish
func (h *Handler) HideMessage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if err := h.repo.UpdateMessageStatus(uint(id), models.DiscussionMessageHidden); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Xabar yashirildi", nil)
}

// UnhideMessage — xabarni qayta ko'rsatish
func (h *Handler) UnhideMessage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if err := h.repo.UpdateMessageStatus(uint(id), models.DiscussionMessageActive); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Xabar qayta ko'rsatildi", nil)
}

// ListUsers — muted/blocked userlar ro'yxati
func (h *Handler) ListUsers(c *gin.Context) {
	var params ListUsersParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.repo.ListUserStates(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]AdminUserStateResponse, len(list))
	for i := range list {
		items[i] = toAdminUserStateResponse(&list[i])
	}

	response.Success(c, http.StatusOK, "Discussion users", gin.H{
		"items": items,
		"total": total,
	})
}

// MuteUser — foydalanuvchini mute qilish
func (h *Handler) MuteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	var req MuteRequest
	c.ShouldBindJSON(&req)

	if err := h.repo.MuteUser(uint(id), req.Reason, req.Hours); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi mute qilindi", nil)
}

// UnmuteUser — mute'ni olib tashlash
func (h *Handler) UnmuteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	if err := h.repo.UnmuteUser(uint(id)); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Mute olib tashlandi", nil)
}

// BlockUser — foydalanuvchini bloklash
func (h *Handler) BlockUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	var req BlockRequest
	c.ShouldBindJSON(&req)

	if err := h.repo.BlockUser(uint(id), req.Reason); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi bloklandi", nil)
}

// UnblockUser — blokni olib tashlash
func (h *Handler) UnblockUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid user ID", nil)
		return
	}

	if err := h.repo.UnblockUser(uint(id)); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Blok olib tashlandi", nil)
}

// GetSettings — chat sozlamalarini olish
func (h *Handler) GetSettings(c *gin.Context) {
	settings, err := h.repo.GetSettings()
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Discussion settings", settings)
}

// UpdateSettings — chat sozlamalarini yangilash
func (h *Handler) UpdateSettings(c *gin.Context) {
	var req struct {
		IsChatEnabled *bool `json:"is_chat_enabled"`
		ReadOnlyMode  *bool `json:"read_only_mode"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	settings, err := h.repo.GetSettings()
	if err != nil {
		response.InternalError(c)
		return
	}

	updates := map[string]interface{}{}
	if req.IsChatEnabled != nil {
		updates["is_chat_enabled"] = *req.IsChatEnabled
	}
	if req.ReadOnlyMode != nil {
		updates["read_only_mode"] = *req.ReadOnlyMode
	}

	staffID, _ := c.Get("staffID")
	if sid, ok := staffID.(uint); ok {
		updates["updated_by_id"] = sid
	}

	if err := h.repo.UpdateSettings(settings.ID, updates); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Sozlamalar yangilandi", nil)
}
