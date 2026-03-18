package adminverifications

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
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// List GET /admin/verifications — pending userlar ro'yxati
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.DefaultQuery("status", "pending")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var verifications []models.UserVerification
	var total int64

	q := h.db.Model(&models.UserVerification{})

	if status != "" && status != "all" {
		q = q.Where("user_verifications.status = ?", status)
	}

	if search != "" {
		q = q.Joins("JOIN \"user\" ON \"user\".id = user_verifications.user_id").
			Joins("LEFT JOIN profile ON profile.user_id = user_verifications.user_id").
			Where("\"user\".username ILIKE ? OR profile.first_name ILIKE ? OR profile.last_name ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	q.Count(&total)

	h.db.Model(&models.UserVerification{}).
		Preload("User").
		Preload("User.Profile").
		Where(func() string {
			w := "1=1"
			if status != "" && status != "all" {
				w = "user_verifications.status = '" + status + "'"
			}
			return w
		}()).
		Order("user_verifications.created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&verifications)

	// If search is active, filter in simpler way
	if search != "" {
		verifications = nil
		sq := h.db.Preload("User").Preload("User.Profile").
			Joins("JOIN \"user\" ON \"user\".id = user_verifications.user_id").
			Joins("LEFT JOIN profile ON profile.user_id = user_verifications.user_id")
		if status != "" && status != "all" {
			sq = sq.Where("user_verifications.status = ?", status)
		}
		sq.Where("\"user\".username ILIKE ? OR profile.first_name ILIKE ? OR profile.last_name ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%").
			Order("user_verifications.created_at DESC").
			Offset((page - 1) * pageSize).
			Limit(pageSize).
			Find(&verifications)
	}

	type VerificationItem struct {
		ID           uint       `json:"id"`
		UserID       uint       `json:"user_id"`
		Username     string     `json:"username"`
		FirstName    string     `json:"first_name"`
		LastName     string     `json:"last_name"`
		PhotoURL     string     `json:"photo_url"`
		Region       string     `json:"region"`
		District     string     `json:"district"`
		SchoolName   string     `json:"school_name"`
		Grade        int        `json:"grade"`
		Method       string     `json:"method"`
		Status       string     `json:"status"`
		Note         string     `json:"note"`
		Reason       string     `json:"reason"`
		RegisteredAt string     `json:"registered_at"`
		CreatedAt    string     `json:"created_at"`
		VerifiedAt   *time.Time `json:"verified_at"`
	}

	var items []VerificationItem
	for _, v := range verifications {
		item := VerificationItem{
			ID:         v.ID,
			UserID:     v.UserID,
			Method:     v.Method,
			Status:     v.Status,
			Note:       v.Note,
			Reason:     v.Reason,
			CreatedAt:  v.CreatedAt.Format(time.RFC3339),
			VerifiedAt: v.VerifiedAt,
		}
		if v.User.ID > 0 {
			item.Username = v.User.Username
			item.RegisteredAt = v.User.CreatedAt.Format(time.RFC3339)
		}
		if v.User.Profile != nil {
			item.FirstName = v.User.Profile.FirstName
			item.LastName = v.User.Profile.LastName
			item.PhotoURL = v.User.Profile.PhotoURL
			item.Region = v.User.Profile.Region
			item.District = v.User.Profile.District
			item.SchoolName = v.User.Profile.SchoolName
			item.Grade = v.User.Profile.Grade
		}
		items = append(items, item)
	}

	response.Success(c, http.StatusOK, "Verifications", gin.H{
		"data":      items,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetByID GET /admin/verifications/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID", nil)
		return
	}

	var v models.UserVerification
	if h.db.Preload("User").Preload("User.Profile").First(&v, id).Error != nil {
		response.NotFound(c, "Verification topilmadi")
		return
	}

	response.Success(c, http.StatusOK, "Verification", v)
}

// Approve POST /admin/verifications/:id/approve
func (h *Handler) Approve(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID", nil)
		return
	}

	var body struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&body)

	staffID, _ := c.Get("staff_id")
	sid, _ := staffID.(uint)

	var v models.UserVerification
	if h.db.First(&v, id).Error != nil {
		response.NotFound(c, "Verification topilmadi")
		return
	}

	if v.Status != "pending" {
		response.Error(c, http.StatusConflict, "Bu verification allaqachon ko'rib chiqilgan", nil)
		return
	}

	now := time.Now()

	// Update verification record
	h.db.Model(&v).Updates(map[string]interface{}{
		"status":      "approved",
		"note":        body.Note,
		"approved_by": sid,
		"verified_at": now,
	})

	// Update user — set is_telegram_linked = true (unlocks all features)
	h.db.Model(&models.User{}).Where("id = ?", v.UserID).Updates(map[string]interface{}{
		"is_telegram_linked":  true,
		"verification_method": "admin_manual",
		"verified_at":         now,
		"verified_by":         sid,
	})

	// Audit log
	resourceID := v.UserID
	h.db.Create(&models.AuditLog{
		ActorID:    sid,
		ActorType:  "staff",
		Action:     "user_verified_by_admin",
		Resource:   "user",
		ResourceID: &resourceID,
		Details:    "Admin manual verification. Note: " + body.Note,
	})

	response.Success(c, http.StatusOK, "Foydalanuvchi muvaffaqiyatli tasdiqlandi", gin.H{
		"user_id":     v.UserID,
		"status":      "approved",
		"verified_at": now.Format(time.RFC3339),
	})
}

// Reject POST /admin/verifications/:id/reject
func (h *Handler) Reject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID", nil)
		return
	}

	var body struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Sabab kiritish majburiy", nil)
		return
	}

	staffID, _ := c.Get("staff_id")
	sid, _ := staffID.(uint)

	var v models.UserVerification
	if h.db.First(&v, id).Error != nil {
		response.NotFound(c, "Verification topilmadi")
		return
	}

	if v.Status != "pending" {
		response.Error(c, http.StatusConflict, "Bu verification allaqachon ko'rib chiqilgan", nil)
		return
	}

	h.db.Model(&v).Updates(map[string]interface{}{
		"status": "rejected",
		"reason": body.Reason,
	})

	// Audit log
	resourceID := v.UserID
	h.db.Create(&models.AuditLog{
		ActorID:    sid,
		ActorType:  "staff",
		Action:     "user_verification_rejected",
		Resource:   "user",
		ResourceID: &resourceID,
		Details:    "Rejected. Reason: " + body.Reason,
	})

	response.Success(c, http.StatusOK, "Verification rad etildi", nil)
}

// ApproveByUserID POST /admin/verifications/user/:user_id/approve
func (h *Handler) ApproveByUserID(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri user ID", nil)
		return
	}

	var body struct {
		Note string `json:"note"`
	}
	c.ShouldBindJSON(&body)

	staffID, _ := c.Get("staff_id")
	sid, _ := staffID.(uint)

	// Check user exists
	var user models.User
	if h.db.First(&user, userID).Error != nil {
		response.NotFound(c, "Foydalanuvchi topilmadi")
		return
	}

	if user.IsTelegramLinked {
		response.Error(c, http.StatusConflict, "Foydalanuvchi allaqachon tasdiqlangan", nil)
		return
	}

	now := time.Now()

	// Find or create verification record
	var v models.UserVerification
	if h.db.Where("user_id = ? AND status = 'pending'", userID).First(&v).Error != nil {
		// No pending verification — create one and approve it
		v = models.UserVerification{
			UserID: uint(userID),
			Method: "admin_manual",
			Status: "approved",
			Note:   body.Note,
			ApprovedBy: &sid,
			VerifiedAt: &now,
		}
		h.db.Create(&v)
	} else {
		h.db.Model(&v).Updates(map[string]interface{}{
			"status":      "approved",
			"method":      "admin_manual",
			"note":        body.Note,
			"approved_by": sid,
			"verified_at": now,
		})
	}

	// Update user
	h.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"is_telegram_linked":  true,
		"verification_method": "admin_manual",
		"verified_at":         now,
		"verified_by":         sid,
	})

	// Audit log
	resourceID := uint(userID)
	h.db.Create(&models.AuditLog{
		ActorID:    sid,
		ActorType:  "staff",
		Action:     "user_verified_by_admin",
		Resource:   "user",
		ResourceID: &resourceID,
		Details:    "Admin manual verification. Note: " + body.Note,
	})

	response.Success(c, http.StatusOK, "Foydalanuvchi muvaffaqiyatli tasdiqlandi", gin.H{
		"user_id":     userID,
		"status":      "approved",
		"verified_at": now.Format(time.RFC3339),
	})
}

// RejectByUserID POST /admin/verifications/user/:user_id/reject
func (h *Handler) RejectByUserID(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri user ID", nil)
		return
	}

	var body struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Sabab kiritish majburiy", nil)
		return
	}

	staffID, _ := c.Get("staff_id")
	sid, _ := staffID.(uint)

	// Find or create verification record
	var v models.UserVerification
	if h.db.Where("user_id = ? AND status = 'pending'", userID).First(&v).Error != nil {
		v = models.UserVerification{
			UserID: uint(userID),
			Method: "admin_manual",
			Status: "rejected",
			Reason: body.Reason,
		}
		h.db.Create(&v)
	} else {
		h.db.Model(&v).Updates(map[string]interface{}{
			"status": "rejected",
			"reason": body.Reason,
		})
	}

	// Audit log
	resourceID := uint(userID)
	h.db.Create(&models.AuditLog{
		ActorID:    sid,
		ActorType:  "staff",
		Action:     "user_verification_rejected",
		Resource:   "user",
		ResourceID: &resourceID,
		Details:    "Rejected. Reason: " + body.Reason,
	})

	response.Success(c, http.StatusOK, "Verification rad etildi", nil)
}

// GetVerificationStatus GET /profile/verification-status (user endpoint)
func (h *Handler) GetVerificationStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid, _ := userID.(uint)

	var v models.UserVerification
	found := h.db.Where("user_id = ?", uid).Order("created_at DESC").First(&v).Error == nil

	var user models.User
	h.db.First(&user, uid)

	response.Success(c, http.StatusOK, "Verification status", gin.H{
		"is_telegram_linked":   user.IsTelegramLinked,
		"is_profile_completed": user.IsProfileCompleted,
		"verification_method":  user.VerificationMethod,
		"verification_status": func() string {
			if found {
				return v.Status
			}
			return "none"
		}(),
		"verified_at": user.VerifiedAt,
	})
}
