package publicnews

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

// List — public yangiliklar ro'yxati
// GET /api/v1/public/news?type=news&search=olimpiada&page=1&page_size=20
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

	response.Success(c, http.StatusOK, "Public news", result)
}

// GetByID — public yangilik detail (view_count increment)
// GET /api/v1/public/news/:id
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

	response.Success(c, http.StatusOK, "News detail", result)
}

// GetBySlug — public yangilik slug bo'yicha
// GET /api/v1/public/news/slug/:slug
func (h *Handler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.Error(c, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	result, err := h.service.GetBySlug(slug)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "News detail", result)
}
