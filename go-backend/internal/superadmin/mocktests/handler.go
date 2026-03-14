package samocktests

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

// List GET /api/v1/superadmin/mock-tests
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

	items := make([]MockTestResponse, len(list))
	for i, m := range list {
		items[i] = ToResponse(&m)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Mock tests", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/mock-tests/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	m, err := h.svc.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Mock test not found")
			return
		}
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Mock test", ToResponse(m))
}

// Create POST /api/v1/superadmin/mock-tests
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	staffID, _ := c.Get("staffID")
	m, err := h.svc.Create(&req, staffID.(uint))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusCreated, "Mock test created", ToResponse(m))
}

// Update PUT /api/v1/superadmin/mock-tests/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.svc.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Mock test not found")
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
	response.Success(c, http.StatusOK, "Mock test updated", ToResponse(updated))
}

// Delete DELETE /api/v1/superadmin/mock-tests/:id
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
	response.Success(c, http.StatusOK, "Mock test deleted", nil)
}
