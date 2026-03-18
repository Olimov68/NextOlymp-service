package adminusers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{repo: NewRepository(db)}
}

// List — foydalanuvchilar ro'yxati
// GET /api/v1/admin/users
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

	items := make([]gin.H, len(list))
	for i, u := range list {
		items[i] = gin.H{
			"id":                    u.ID,
			"username":              u.Username,
			"status":                u.Status,
			"is_profile_completed":  u.IsProfileCompleted,
			"is_telegram_linked":    u.IsTelegramLinked,
			"verification_status":   u.VerificationStatus,
			"created_at":            u.CreatedAt,
		}
	}

	response.Success(c, http.StatusOK, "Users", gin.H{
		"data": items, "total": total,
		"page": params.Page, "page_size": params.PageSize,
	})
}

// GetByID — bitta user
// GET /api/v1/admin/users/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	u, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, http.StatusOK, "User", u)
}

// Block — userni bloklash
// PATCH /api/v1/admin/users/:id/block
func (h *Handler) Block(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	if err := h.repo.UpdateStatus(uint(id), models.UserStatusBlocked); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "User blocked", nil)
}

// Unblock — userni blokdan chiqarish
// PATCH /api/v1/admin/users/:id/unblock
func (h *Handler) Unblock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	if err := h.repo.UpdateStatus(uint(id), models.UserStatusActive); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "User unblocked", nil)
}

// Verify — admin foydalanuvchini tasdiqlaydi
// PATCH /api/v1/admin/users/:id/verify
func (h *Handler) Verify(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var req struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&req)

	staffID, _ := c.Get("staffID")
	var staffIDPtr *uint
	if sid, ok := staffID.(uint); ok {
		staffIDPtr = &sid
	}

	now := time.Now()
	if err := h.repo.db.Model(&models.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"verification_status":  models.VerificationAdminVerified,
		"verified_at":          &now,
		"verified_by_staff_id": staffIDPtr,
		"verification_note":    req.Note,
		"is_profile_completed": true,
		"status":               models.UserStatusActive,
	}).Error; err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi tasdiqlandi", nil)
}

// Reject — admin foydalanuvchini rad etadi
// PATCH /api/v1/admin/users/:id/reject
func (h *Handler) Reject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var req struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&req)

	staffID, _ := c.Get("staffID")
	var staffIDPtr *uint
	if sid, ok := staffID.(uint); ok {
		staffIDPtr = &sid
	}

	if err := h.repo.db.Model(&models.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"verification_status":  models.VerificationRejected,
		"verified_by_staff_id": staffIDPtr,
		"verification_note":    req.Note,
	}).Error; err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi rad etildi", nil)
}

// PendingVerification — tasdiqlash kutayotgan userlar
// GET /api/v1/admin/users/pending-verification
func (h *Handler) PendingVerification(c *gin.Context) {
	var list []models.User
	var total int64

	q := h.repo.db.Model(&models.User{}).
		Where("verification_status = ?", models.VerificationPending).
		Where("is_profile_completed = ?", true).
		Where("status = ?", models.UserStatusActive)

	q.Count(&total)
	q.Preload("Profile").Order("created_at ASC").Limit(50).Find(&list)

	items := make([]gin.H, len(list))
	for i, u := range list {
		item := gin.H{
			"id":                    u.ID,
			"username":              u.Username,
			"verification_status":   u.VerificationStatus,
			"is_telegram_linked":    u.IsTelegramLinked,
			"created_at":            u.CreatedAt,
		}
		if u.Profile != nil {
			item["full_name"] = u.Profile.FirstName + " " + u.Profile.LastName
			item["region"] = u.Profile.Region
			item["grade"] = u.Profile.Grade
		}
		items[i] = item
	}

	response.Success(c, http.StatusOK, "Pending verification users", gin.H{
		"data": items, "total": total,
	})
}
