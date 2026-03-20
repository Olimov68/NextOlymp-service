package superadminusers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

type UserListItem struct {
	ID                 uint   `json:"id"`
	Username           string `json:"username"`
	FullName           string `json:"full_name"`
	Region             string `json:"region"`
	Grade              int    `json:"grade"`
	Status             string `json:"status"`
	IsProfileCompleted bool   `json:"is_profile_completed"`
	IsTelegramLinked   bool   `json:"is_telegram_linked"`
	CreatedAt          string `json:"created_at"`
}

type UserDetailResponse struct {
	ID                 uint        `json:"id"`
	Username           string      `json:"username"`
	FullName           string      `json:"full_name"`
	Region             string      `json:"region"`
	District           string      `json:"district"`
	School             string      `json:"school"`
	Grade              int         `json:"grade"`
	BirthDate          string      `json:"birth_date"`
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
	region := c.Query("region")

	var list []models.User
	var total int64
	q := h.db.Model(&models.User{})
	if status != "" {
		q = q.Where("\"user\".status = ?", status)
	} else {
		q = q.Where("\"user\".status != ?", "deleted")
	}
	if search != "" {
		q = q.Where("\"user\".username ILIKE ?", "%"+search+"%")
	}
	if region != "" {
		q = q.Joins("JOIN profile ON profile.user_id = \"user\".id").
			Where("profile.region = ?", region)
	}

	q.Count(&total)
	offset := (page - 1) * pageSize
	q.Preload("Profile").Order("\"user\".created_at DESC").Offset(offset).Limit(pageSize).Find(&list)

	// Flatten profile data for frontend
	items := make([]UserListItem, len(list))
	for i, u := range list {
		item := UserListItem{
			ID:                 u.ID,
			Username:           u.Username,
			Status:             string(u.Status),
			IsProfileCompleted: u.IsProfileCompleted,
			IsTelegramLinked:   u.IsTelegramLinked,
			CreatedAt:          u.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if u.Profile != nil {
			item.FullName = u.Profile.FirstName + " " + u.Profile.LastName
			item.Region = u.Profile.Region
			item.Grade = u.Profile.Grade
		}
		items[i] = item
	}

	response.SuccessWithPagination(c, http.StatusOK, "Users", items, page, pageSize, total)
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
		detail.FullName = u.Profile.FirstName + " " + u.Profile.LastName
		detail.Region = u.Profile.Region
		detail.District = u.Profile.District
		detail.School = u.Profile.SchoolName
		detail.Grade = u.Profile.Grade
		detail.BirthDate = u.Profile.BirthDate
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

// Create POST /api/v1/superadmin/users — admin yangi foydalanuvchi qo'shadi
func (h *Handler) Create(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	// Username band emasligini tekshirish
	var existing models.User
	if h.db.Where("username = ?", req.Username).First(&existing).Error == nil {
		response.Error(c, http.StatusConflict, "Bu username allaqachon band", nil)
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		response.InternalError(c)
		return
	}

	user := models.User{
		Username:           req.Username,
		PasswordHash:       hash,
		Status:             models.UserStatusActive,
		IsProfileCompleted: false,
		IsTelegramLinked:   false,
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Foydalanuvchi yaratishda xatolik", nil)
		return
	}

	response.Success(c, http.StatusCreated, "Foydalanuvchi yaratildi", gin.H{
		"id": user.ID, "username": user.Username, "status": user.Status,
	})
}

// Verify PATCH /api/v1/superadmin/users/:id/verify — admin foydalanuvchini tasdiqlaydi
func (h *Handler) Verify(c *gin.Context) {
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

	// Profilni to'ldirilgan deb belgilash
	h.db.Model(&user).Updates(map[string]interface{}{
		"is_profile_completed": true,
		"status":               models.UserStatusActive,
	})

	response.Success(c, http.StatusOK, "Foydalanuvchi tasdiqlandi", nil)
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
