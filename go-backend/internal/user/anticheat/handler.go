package anticheat

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Handler — anti-cheat handler
type Handler struct {
	db *gorm.DB
}

// NewHandler — yangi handler yaratish
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// ReportViolationRequest — qoidabuzarlik haqida xabar
type ReportViolationRequest struct {
	AttemptID   uint   `json:"attempt_id" binding:"required"`
	AttemptType string `json:"attempt_type" binding:"required,oneof=olympiad mock_test"` // olympiad, mock_test
	Type        string `json:"type" binding:"required"`                                   // tab_switch, blur, copy_paste, devtools, right_click, fullscreen_exit, offline, screenshot, screen_record, face_not_found, face_mismatch, multiple_faces, voice_detected
	Severity    string `json:"severity"`                                                  // info, warning, critical
	DeviceType  string `json:"device_type"`                                               // web, windows, android
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// ReportViolation — qoidabuzarlikni xabar qilish (frontend dan keladi)
func (h *Handler) ReportViolation(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid, _ := userID.(uint)

	var req ReportViolationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ma'lumot", nil)
		return
	}

	if req.Severity == "" {
		req.Severity = "warning"
	}
	if req.DeviceType == "" {
		req.DeviceType = "web"
	}

	// Attempt tegishliligini tekshirish
	if req.AttemptType == "olympiad" {
		var attempt models.OlympiadAttempt
		if h.db.Where("id = ? AND user_id = ?", req.AttemptID, uid).First(&attempt).Error != nil {
			response.Error(c, http.StatusForbidden, "Attempt topilmadi", nil)
			return
		}
	} else {
		var attempt models.MockAttempt
		if h.db.Where("id = ? AND user_id = ?", req.AttemptID, uid).First(&attempt).Error != nil {
			response.Error(c, http.StatusForbidden, "Attempt topilmadi", nil)
			return
		}
	}

	// Metadata ni JSON ga o'girish
	var metadataJSON datatypes.JSON
	if req.Metadata != nil {
		if raw, err := json.Marshal(req.Metadata); err == nil {
			metadataJSON = datatypes.JSON(raw)
		}
	}

	violation := models.AntiCheatViolation{
		UserID:      uid,
		AttemptID:   req.AttemptID,
		AttemptType: req.AttemptType,
		Type:        req.Type,
		Severity:    req.Severity,
		DeviceType:  req.DeviceType,
		Metadata:    metadataJSON,
		IPAddress:   c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	}

	h.db.Create(&violation)

	// Violation count ni tekshirish va qaytarish
	var violationCount int64
	h.db.Model(&models.AntiCheatViolation{}).
		Where("attempt_id = ? AND attempt_type = ?", req.AttemptID, req.AttemptType).
		Count(&violationCount)

	// SecuritySetting dan max violations ni olish
	var secSetting models.SecuritySetting
	maxViolations := 10 // default
	autoSubmit := false
	if h.db.First(&secSetting).Error == nil {
		if secSetting.TabSwitchLimit > 0 {
			maxViolations = secSetting.TabSwitchLimit
		}
	}

	if int(violationCount) >= maxViolations {
		autoSubmit = true
	}

	response.Success(c, http.StatusOK, "Qoidabuzarlik qayd etildi", gin.H{
		"violation_count": violationCount,
		"max_violations":  maxViolations,
		"auto_submit":     autoSubmit,
	})
}

// GetViolations — attempt bo'yicha qoidabuzarliklar ro'yxati (admin uchun)
func (h *Handler) GetViolations(c *gin.Context) {
	attemptID, err := strconv.ParseUint(c.Param("attempt_id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri attempt ID", nil)
		return
	}

	attemptType := c.DefaultQuery("type", "olympiad")

	var violations []models.AntiCheatViolation
	h.db.Where("attempt_id = ? AND attempt_type = ?", attemptID, attemptType).
		Order("created_at ASC").
		Find(&violations)

	response.Success(c, http.StatusOK, "Qoidabuzarliklar", gin.H{
		"violations": violations,
		"total":      len(violations),
	})
}

// GetSuspiciousAttempts — shubhali attemptlar ro'yxati (admin uchun)
func (h *Handler) GetSuspiciousAttempts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// 3+ violation li attemptlarni topish
	type SuspiciousAttempt struct {
		AttemptID      uint   `json:"attempt_id"`
		AttemptType    string `json:"attempt_type"`
		UserID         uint   `json:"user_id"`
		ViolationCount int64  `json:"violation_count"`
	}

	var results []SuspiciousAttempt
	var total int64

	subQuery := h.db.Model(&models.AntiCheatViolation{}).
		Select("attempt_id, attempt_type, user_id, COUNT(*) as violation_count").
		Group("attempt_id, attempt_type, user_id").
		Having("COUNT(*) >= 3")

	h.db.Table("(?) as s", subQuery).Count(&total)
	h.db.Table("(?) as s", subQuery).
		Order("violation_count DESC").
		Offset(offset).
		Limit(limit).
		Find(&results)

	response.Success(c, http.StatusOK, "Shubhali attemptlar", gin.H{
		"attempts": results,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}
