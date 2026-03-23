package userolympiads

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

// List — olimpiadalar ro'yxati
// GET /api/v1/user/olympiads
func (h *Handler) List(c *gin.Context) {
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

	response.Success(c, http.StatusOK, "Olympiads", result)
}

// GetByID — bitta olimpiada detail (user holati bilan)
// GET /api/v1/user/olympiads/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	result, err := h.service.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	// User holati — ro'yxatdan o'tganmi, topshirganmi
	userStatus := map[string]interface{}{
		"is_joined":     false,
		"has_attempted":  false,
		"attempt_status": "",
		"attempt_id":     uint(0),
	}
	if uid, exists := c.Get("userID"); exists {
		userID := uid.(uint)
		userStatus = h.service.GetUserOlympiadStatus(userID, uint(id))
	}

	resp := map[string]interface{}{
		"olympiad":    result,
		"user_status": userStatus,
	}

	response.Success(c, http.StatusOK, "Olympiad detail", resp)
}

// MyOlympiads — mening olimpiadalarim
// GET /api/v1/user/olympiads/my
func (h *Handler) MyOlympiads(c *gin.Context) {
	userID, _ := c.Get("userID")

	result, err := h.service.GetMyOlympiads(userID.(uint))
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "My olympiads", result)
}

// Join — olimpiadaga qo'shilish
// POST /api/v1/user/olympiads/:id/join
func (h *Handler) Join(c *gin.Context) {
	userID, _ := c.Get("userID")

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	result, err := h.service.Join(userID.(uint), uint(id))
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, "Successfully joined olympiad", result)
}
