package adminusers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
	db   *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{repo: NewRepository(db), db: db}
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
			"id":                   u.ID,
			"username":             u.Username,
			"status":               u.Status,
			"is_profile_completed": u.IsProfileCompleted,
			"is_telegram_linked":   u.IsTelegramLinked,
			"created_at":           u.CreatedAt,
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

// Delete — foydalanuvchini bazadan to'liq o'chirish
// DELETE /api/v1/admin/users/:id
func (h *Handler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		response.NotFound(c, "Foydalanuvchi topilmadi")
		return
	}

	tx := h.db.Begin()

	// Barcha bog'liq jadvallarni raw SQL bilan o'chirish
	tables := []string{
		"session", "telegram_link",
		"profile",
		"chat_messages", "chat_bans",
		"discussion_message", "discussion_user_state",
		"notification", "notification_preference",
		"promo_code_usage", "balance", "balance_transaction", "payment",
		"certificate",
		"ai_analysis",
		"feedback",
		"exam_violation",
		"user_verifications",
	}
	for _, t := range tables {
		tx.Exec("DELETE FROM \""+t+"\" WHERE user_id = ?", id)
	}

	// Olimpiada urinishlari (child -> parent)
	tx.Exec("DELETE FROM olympiad_attempt_answer WHERE attempt_id IN (SELECT id FROM olympiad_attempt WHERE user_id = ?)", id)
	tx.Exec("DELETE FROM anti_cheat_violations WHERE user_id = ?", id)
	tx.Exec("DELETE FROM olympiad_attempt WHERE user_id = ?", id)
	tx.Exec("DELETE FROM olympiad_registration WHERE user_id = ?", id)

	// Mock test urinishlari (child -> parent)
	tx.Exec("DELETE FROM mock_attempt_answer WHERE attempt_id IN (SELECT id FROM mock_attempt WHERE user_id = ?)", id)
	tx.Exec("DELETE FROM mock_attempt WHERE user_id = ?", id)
	tx.Exec("DELETE FROM mock_test_registration WHERE user_id = ?", id)

	// User o'zi
	tx.Exec("DELETE FROM \"user\" WHERE id = ?", id)

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		response.Error(c, http.StatusInternalServerError, "Foydalanuvchini o'chirishda xatolik")
		return
	}

	response.Success(c, http.StatusOK, "Foydalanuvchi bazadan to'liq o'chirildi", nil)
}
