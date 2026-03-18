package userdiscussion

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List — muhokama xabarlari ro'yxati
// GET /api/v1/user/discussion/messages
func (h *Handler) List(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Blocked user ko'ra olmaydi
	if h.service.repo.IsBlocked(userID) {
		response.Forbidden(c, "Siz muhokamadan bloklangansiz")
		return
	}

	var params ListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	result, err := h.service.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Muhokama xabarlari", result)
}

// GetMyState — mening muhokamadagi holatim
// GET /api/v1/user/discussion/state
func (h *Handler) GetMyState(c *gin.Context) {
	userID := c.GetUint("user_id")

	state, err := h.service.GetMyState(userID)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Discussion state", state)
}

// Create — yangi xabar yozish
// POST /api/v1/user/discussion/messages
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	result, err := h.service.Create(userID, req)
	if err != nil {
		response.Error(c, http.StatusForbidden, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Xabar yuborildi", result)
}

// Update — o'z xabarini tahrirlash
// PUT /api/v1/user/discussion/messages/:id
func (h *Handler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var req UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	result, err := h.service.Update(userID, uint(id), req)
	if err != nil {
		response.Error(c, http.StatusForbidden, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Xabar yangilandi", result)
}

// Delete — o'z xabarini o'chirish (soft delete)
// DELETE /api/v1/user/discussion/messages/:id
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if err := h.service.Delete(userID, uint(id)); err != nil {
		response.Error(c, http.StatusForbidden, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Xabar o'chirildi", nil)
}
