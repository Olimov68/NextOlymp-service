package superadminadmins

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{repo: NewRepository(db)}
}

// List GET /api/v1/superadmin/admins
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.repo.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]AdminResponse, len(list))
	for i, s := range list {
		item := ToAdminResponse(&s)
		item.Permissions = h.repo.GetPermissionCodes(s.ID)
		items[i] = item
	}

	response.SuccessWithPagination(c, http.StatusOK, "Admins", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/admins/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	s, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Admin not found")
		return
	}
	resp := ToAdminResponse(s)
	resp.Permissions = h.repo.GetPermissionCodes(s.ID)
	response.Success(c, http.StatusOK, "Admin", resp)
}

// Create POST /api/v1/superadmin/admins
func (h *Handler) Create(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	exists, _ := h.repo.UsernameExists(req.Username)
	if exists {
		response.Error(c, http.StatusConflict, "Username already taken", nil)
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		response.InternalError(c)
		return
	}

	staff := &models.StaffUser{
		Username:     req.Username,
		PasswordHash: hash,
		FullName:     req.FullName,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		Phone:        req.Phone,
		Role:         models.StaffRole(req.Role),
		Status:       models.StaffStatusActive,
	}

	if err := h.repo.Create(staff); err != nil {
		response.InternalError(c)
		return
	}

	// Assign permissions if provided
	if len(req.PermissionIDs) > 0 {
		staffIDVal, _ := c.Get("staffID")
		grantedBy, _ := staffIDVal.(uint)
		_ = h.repo.AssignPermissions(staff.ID, req.PermissionIDs, grantedBy)
	}

	resp := ToAdminResponse(staff)
	resp.Permissions = h.repo.GetPermissionCodes(staff.ID)
	response.Success(c, http.StatusCreated, "Admin created", resp)
}

// Update PUT /api/v1/superadmin/admins/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Admin not found")
			return
		}
		response.InternalError(c)
		return
	}

	var req UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	fields := map[string]interface{}{}
	if req.FullName != nil {
		fields["full_name"] = *req.FullName
	}
	if req.FirstName != nil {
		fields["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		fields["last_name"] = *req.LastName
	}
	if req.Email != nil {
		fields["email"] = *req.Email
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}
	if req.Role != nil {
		fields["role"] = *req.Role
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}

	if len(fields) > 0 {
		if err := h.repo.Update(uint(id), fields); err != nil {
			response.InternalError(c)
			return
		}
	}

	// Assign permissions if provided
	if req.PermissionIDs != nil {
		staffIDVal, _ := c.Get("staffID")
		grantedBy, _ := staffIDVal.(uint)
		_ = h.repo.AssignPermissions(uint(id), *req.PermissionIDs, grantedBy)
	}

	updated, _ := h.repo.GetByID(uint(id))
	resp := ToAdminResponse(updated)
	resp.Permissions = h.repo.GetPermissionCodes(updated.ID)
	response.Success(c, http.StatusOK, "Admin updated", resp)
}

// Delete DELETE /api/v1/superadmin/admins/:id
func (h *Handler) Delete(c *gin.Context) {
	staffID, _ := c.Get("staffID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	// O'zini o'chira olmasin
	if uint(id) == staffID.(uint) {
		response.Error(c, http.StatusBadRequest, "Cannot delete yourself", nil)
		return
	}
	if err := h.repo.Delete(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Admin deleted", nil)
}

// Block PATCH /api/v1/superadmin/admins/:id/block
func (h *Handler) Block(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	h.repo.Update(uint(id), map[string]interface{}{"status": models.StaffStatusBlocked})
	response.Success(c, http.StatusOK, "Admin blocked", nil)
}

// Unblock PATCH /api/v1/superadmin/admins/:id/unblock
func (h *Handler) Unblock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	h.repo.Update(uint(id), map[string]interface{}{"status": models.StaffStatusActive})
	response.Success(c, http.StatusOK, "Admin unblocked", nil)
}
