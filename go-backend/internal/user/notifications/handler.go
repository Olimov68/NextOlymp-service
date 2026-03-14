package notifications

import (
	"fmt"
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

// List — bildirishnomalar ro'yxati
func (h *Handler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	isRead := c.Query("is_read")

	query := h.db.Model(&models.Notification{}).Where("user_id = ?", userID)
	if isRead == "true" {
		query = query.Where("is_read = true")
	} else if isRead == "false" {
		query = query.Where("is_read = false")
	}

	var total int64
	query.Count(&total)

	var notifications []models.Notification
	offset := (page - 1) * limit
	query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&notifications)

	// O'qilmagan soni
	var unreadCount int64
	h.db.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", userID).Count(&unreadCount)

	response.Success(c, http.StatusOK, "Bildirishnomalar", gin.H{
		"notifications": notifications,
		"total":         total,
		"unread_count":  unreadCount,
		"page":          page,
		"limit":         limit,
	})
}

// MarkAsRead — bitta bildirishnomani o'qilgan deb belgilash
func (h *Handler) MarkAsRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	result := h.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{"is_read": true, "read_at": gorm.Expr("NOW()")})

	if result.RowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Bildirishnoma topilmadi")
		return
	}

	response.Success(c, http.StatusOK, "O'qilgan deb belgilandi", nil)
}

// MarkAllAsRead — hammasini o'qilgan deb belgilash
func (h *Handler) MarkAllAsRead(c *gin.Context) {
	userID := c.GetUint("user_id")

	h.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Updates(map[string]interface{}{"is_read": true, "read_at": gorm.Expr("NOW()")})

	response.Success(c, http.StatusOK, "Barcha bildirishnomalar o'qildi", nil)
}

// UnreadCount — o'qilmagan bildirishnomalar soni
func (h *Handler) UnreadCount(c *gin.Context) {
	userID := c.GetUint("user_id")

	var count int64
	h.db.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", userID).Count(&count)

	response.Success(c, http.StatusOK, "O'qilmagan soni", gin.H{"count": count})
}

// Delete — bildirishnomani o'chirish
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	result := h.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{})
	if result.RowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Bildirishnoma topilmadi")
		return
	}

	response.Success(c, http.StatusOK, "Bildirishnoma o'chirildi", nil)
}

// --- Bildirishnoma sozlamalari ---

// NotificationPreferenceResponse — sozlamalar javobi
type NotificationPreferenceResponse struct {
	Olympiads    bool `json:"olympiads"`
	Payments     bool `json:"payments"`
	News         bool `json:"news"`
	MockTests    bool `json:"mock_tests"`
	Results      bool `json:"results"`
	Certificates bool `json:"certificates"`
	Leaderboard  bool `json:"leaderboard"`
	Promotions   bool `json:"promotions"`
}

// UpdatePreferenceRequest — sozlamalarni yangilash
type UpdatePreferenceRequest struct {
	Olympiads    *bool `json:"olympiads"`
	Payments     *bool `json:"payments"`
	News         *bool `json:"news"`
	MockTests    *bool `json:"mock_tests"`
	Results      *bool `json:"results"`
	Certificates *bool `json:"certificates"`
	Leaderboard  *bool `json:"leaderboard"`
	Promotions   *bool `json:"promotions"`
}

// GetPreferences — foydalanuvchi bildirishnoma sozlamalarini olish
func (h *Handler) GetPreferences(c *gin.Context) {
	userID := c.GetUint("user_id")

	var pref models.NotificationPreference
	err := h.db.Where("user_id = ?", userID).First(&pref).Error
	if err != nil {
		// Default sozlamalar (hammasi yoniq)
		response.Success(c, http.StatusOK, "Bildirishnoma sozlamalari", NotificationPreferenceResponse{
			Olympiads:    true,
			Payments:     true,
			News:         true,
			MockTests:    true,
			Results:      true,
			Certificates: true,
			Leaderboard:  true,
			Promotions:   true,
		})
		return
	}

	response.Success(c, http.StatusOK, "Bildirishnoma sozlamalari", NotificationPreferenceResponse{
		Olympiads:    pref.Olympiads,
		Payments:     pref.Payments,
		News:         pref.News,
		MockTests:    pref.MockTests,
		Results:      pref.Results,
		Certificates: pref.Certificates,
		Leaderboard:  pref.Leaderboard,
		Promotions:   pref.Promotions,
	})
}

// UpdatePreferences — bildirishnoma sozlamalarini yangilash
func (h *Handler) UpdatePreferences(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req UpdatePreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	var pref models.NotificationPreference
	err := h.db.Where("user_id = ?", userID).First(&pref).Error
	if err != nil {
		// Yangi yaratish (default hammasi true)
		pref = models.NotificationPreference{
			UserID:       userID,
			Olympiads:    true,
			Payments:     true,
			News:         true,
			MockTests:    true,
			Results:      true,
			Certificates: true,
			Leaderboard:  true,
			Promotions:   true,
		}
	}

	// Faqat kelgan fieldlarni yangilash
	if req.Olympiads != nil {
		pref.Olympiads = *req.Olympiads
	}
	if req.Payments != nil {
		pref.Payments = *req.Payments
	}
	if req.News != nil {
		pref.News = *req.News
	}
	if req.MockTests != nil {
		pref.MockTests = *req.MockTests
	}
	if req.Results != nil {
		pref.Results = *req.Results
	}
	if req.Certificates != nil {
		pref.Certificates = *req.Certificates
	}
	if req.Leaderboard != nil {
		pref.Leaderboard = *req.Leaderboard
	}
	if req.Promotions != nil {
		pref.Promotions = *req.Promotions
	}

	if pref.ID == 0 {
		h.db.Create(&pref)
	} else {
		h.db.Save(&pref)
	}

	response.Success(c, http.StatusOK, "Sozlamalar saqlandi", NotificationPreferenceResponse{
		Olympiads:    pref.Olympiads,
		Payments:     pref.Payments,
		News:         pref.News,
		MockTests:    pref.MockTests,
		Results:      pref.Results,
		Certificates: pref.Certificates,
		Leaderboard:  pref.Leaderboard,
		Promotions:   pref.Promotions,
	})
}

// GetCategories — mavjud bildirishnoma kategoriyalarini qaytaradi
func (h *Handler) GetCategories(c *gin.Context) {
	categories := []map[string]interface{}{
		{"key": "olympiads", "label": "Olimpiadalar", "description": "Olimpiada e'lonlari va natijalar"},
		{"key": "payments", "label": "To'lovlar", "description": "To'lov holatlari va qaytarishlar"},
		{"key": "news", "label": "Yangiliklar", "description": "Yangiliklar va e'lonlar"},
		{"key": "mock_tests", "label": "Mock testlar", "description": "Sinov testlari e'lonlari va natijalar"},
		{"key": "results", "label": "Natijalar", "description": "Natijalar va reyting yangiliklari"},
		{"key": "certificates", "label": "Sertifikatlar", "description": "Sertifikat tayyorligi haqida"},
		{"key": "leaderboard", "label": "Leaderboard", "description": "Peshqadamlar reytingi yangilanishi"},
		{"key": "promotions", "label": "Promo code va chegirmalar", "description": "Chegirmalar va maxsus takliflar"},
	}

	response.Success(c, http.StatusOK, "Bildirishnoma kategoriyalari", categories)
}

// CreateNotification — bildirishnoma yaratish helper (boshqa modullardan chaqiriladi)
func CreateNotification(db *gorm.DB, userID uint, notifType, title, message, actionURL, sourceType string, sourceID *uint) {
	notification := models.Notification{
		UserID:     userID,
		Type:       notifType,
		Title:      title,
		Message:    message,
		ActionURL:  actionURL,
		SourceType: sourceType,
		SourceID:   sourceID,
	}
	db.Create(&notification)
}
