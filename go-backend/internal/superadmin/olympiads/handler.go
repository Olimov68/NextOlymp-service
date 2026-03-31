package saolympiads

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

// List GET /api/v1/superadmin/olympiads
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

	items := make([]OlympiadResponse, len(list))
	for i, o := range list {
		items[i] = ToResponse(&o)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Olympiads", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/olympiads/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	o, err := h.svc.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olympiad not found")
			return
		}
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Olympiad", ToResponse(o))
}

// Create POST /api/v1/superadmin/olympiads
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	staffID, _ := c.Get("staffID")
	o, err := h.svc.Create(&req, staffID.(uint))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusCreated, "Olympiad created", ToResponse(o))
}

// Update PUT /api/v1/superadmin/olympiads/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.svc.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olympiad not found")
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
	response.Success(c, http.StatusOK, "Olympiad updated", ToResponse(updated))
}

// Delete DELETE /api/v1/superadmin/olympiads/:id
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
	response.Success(c, http.StatusOK, "Olympiad deleted", nil)
}

// ListRegistrations GET /api/v1/superadmin/olympiads/:id/registrations
func (h *Handler) ListRegistrations(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var params PaginationParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.svc.ListRegistrations(uint(id), params.Page, params.PageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]RegistrationResponse, len(list))
	for i, r := range list {
		items[i] = ToRegistrationResponse(&r)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Registrations", items, params.Page, params.PageSize, total)
}

// ListParticipants GET /api/v1/superadmin/olympiads/:id/participants
func (h *Handler) ListParticipants(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var params PaginationParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.svc.ListParticipants(uint(id), params.Page, params.PageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]RegistrationResponse, len(list))
	for i, r := range list {
		items[i] = ToRegistrationResponse(&r)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Participants", items, params.Page, params.PageSize, total)
}

// ListResults GET /api/v1/superadmin/olympiads/:id/results
func (h *Handler) ListResults(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var params PaginationParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.svc.ListResults(uint(id), params.Page, params.PageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]ResultResponse, len(list))
	for i, a := range list {
		items[i] = ToResultResponse(&a)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Results", items, params.Page, params.PageSize, total)
}

// ApproveResult POST /api/v1/superadmin/olympiads/:id/results/:result_id/approve
func (h *Handler) ApproveResult(c *gin.Context) {
	resultID, err := strconv.ParseUint(c.Param("result_id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid result ID", nil)
		return
	}

	if err := h.svc.ApproveResult(uint(resultID)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Result not found")
			return
		}
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Result approved", nil)
}

// Duplicate POST /api/v1/superadmin/olympiads/:id/duplicate
func (h *Handler) Duplicate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	dup, err := h.svc.Duplicate(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olympiad not found")
			return
		}
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusCreated, "Olympiad duplicated", ToResponse(dup))
}

// Publish PATCH /api/v1/superadmin/olympiads/:id/publish
func (h *Handler) Publish(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.svc.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olympiad not found")
			return
		}
		response.InternalError(c)
		return
	}

	if err := h.svc.Publish(uint(id)); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Olimpiada e'lon qilindi", nil)
}

// Unpublish PATCH /api/v1/superadmin/olympiads/:id/unpublish
func (h *Handler) Unpublish(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.svc.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olympiad not found")
			return
		}
		response.InternalError(c)
		return
	}

	if err := h.svc.Unpublish(uint(id)); err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Olimpiada qoralamaga qaytarildi", nil)
}

// ToggleRegistration PATCH /api/v1/superadmin/olympiads/:id/toggle-registration
func (h *Handler) ToggleRegistration(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID", nil)
		return
	}

	o, err := h.svc.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Olimpiada topilmadi")
			return
		}
		response.InternalError(c)
		return
	}

	newState := !o.RegistrationOpen
	if err := h.svc.ToggleRegistration(uint(id), newState); err != nil {
		response.InternalError(c)
		return
	}

	msg := "Ro'yxatdan o'tish yopildi"
	if newState {
		msg = "Ro'yxatdan o'tish ochildi"
	}
	response.Success(c, http.StatusOK, msg, gin.H{"registration_open": newState})
}
