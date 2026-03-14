package superadminusers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

type UserDetailResponse struct {
	ID                 uint        `json:"id"`
	Username           string      `json:"username"`
	Status             string      `json:"status"`
	IsProfileCompleted bool        `json:"is_profile_completed"`
	IsTelegramLinked   bool        `json:"is_telegram_linked"`
	CreatedAt          string      `json:"created_at"`
	UpdatedAt          string      `json:"updated_at"`
	Profile            interface{} `json:"profile,omitempty"`
	TelegramLink       interface{} `json:"telegram_link,omitempty"`
}

// List GET /api/v1/superadmin/users
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	status := c.Query("status")
	search := c.Query("search")

	var list []models.User
	var total int64
	q := h.db.Model(&models.User{})
	if status != "" {
		q = q.Where("status = ?", status)
	} else {
		q = q.Where("status != ?", "deleted")
	}
	if search != "" {
		q = q.Where("username ILIKE ?", "%"+search+"%")
	}

	q.Count(&total)
	offset := (page - 1) * pageSize
	q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&list)

	response.SuccessWithPagination(c, http.StatusOK, "Users", list, page, pageSize, total)
}

// GetByID GET /api/v1/superadmin/users/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	var u models.User
	if err := h.db.Preload("Profile").Preload("TelegramLink").First(&u, id).Error; err != nil {
		response.NotFound(c, "User not found")
		return
	}

	detail := UserDetailResponse{
		ID:                 u.ID,
		Username:           u.Username,
		Status:             string(u.Status),
		IsProfileCompleted: u.IsProfileCompleted,
		IsTelegramLinked:   u.IsTelegramLinked,
		CreatedAt:          u.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:          u.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if u.Profile != nil {
		detail.Profile = u.Profile
	}
	if u.TelegramLink != nil {
		detail.TelegramLink = u.TelegramLink
	}

	response.Success(c, http.StatusOK, "User", detail)
}

// Block PATCH /api/v1/superadmin/users/:id/block
func (h *Handler) Block(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	h.db.Model(&models.User{}).Where("id = ?", id).Update("status", models.UserStatusBlocked)
	response.Success(c, http.StatusOK, "User blocked", nil)
}

// Unblock PATCH /api/v1/superadmin/users/:id/unblock
func (h *Handler) Unblock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	h.db.Model(&models.User{}).Where("id = ?", id).Update("status", models.UserStatusActive)
	response.Success(c, http.StatusOK, "User unblocked", nil)
}

// Delete DELETE /api/v1/superadmin/users/:id (soft delete)
func (h *Handler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	// Foydalanuvchi mavjudligini tekshirish
	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		response.NotFound(c, "Foydalanuvchi topilmadi")
		return
	}

	// Bog'liq ma'lumotlarni o'chirish (foreign key constraints)
	tx := h.db.Begin()
	tx.Where("user_id = ?", id).Delete(&models.Session{})
	tx.Where("user_id = ?", id).Delete(&models.TelegramLink{})
	tx.Where("user_id = ?", id).Delete(&models.Profile{})
	tx.Where("user_id = ?", id).Delete(&models.PromoCodeUsage{})
	tx.Where("user_id = ?", id).Delete(&models.Notification{})
	tx.Delete(&user)

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		response.Error(c, http.StatusInternalServerError, "Foydalanuvchini o'chirishda xatolik")
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi bazadan to'liq o'chirildi", nil)
}
