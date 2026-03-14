package sanews

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	svc *Service
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{svc: NewService(NewRepository(db))}
}

// List GET /api/v1/superadmin/news
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.svc.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]ContentResponse, len(list))
	for i, cont := range list {
		items[i] = ToResponse(&cont)
	}

	response.SuccessWithPagination(c, http.StatusOK, "News/Announcements", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/news/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	cont, err := h.svc.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Content not found")
			return
		}
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Content", ToResponse(cont))
}

// Create POST /api/v1/superadmin/news
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	staffID, _ := c.Get("staffID")
	cont, err := h.svc.Create(&req, staffID.(uint))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusCreated, "Content created", ToResponse(cont))
}

// Update PUT /api/v1/superadmin/news/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.svc.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Content not found")
			return
		}
		response.InternalError(c)
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	updated, err := h.svc.Update(uint(id), &req)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Content updated", ToResponse(updated))
}

// Delete DELETE /api/v1/superadmin/news/:id
func (h *Handler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Content deleted", nil)
}
