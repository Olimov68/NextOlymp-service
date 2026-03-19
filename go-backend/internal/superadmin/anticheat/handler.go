package saanticheat

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

// Handler — superadmin anti-cheat handler
type Handler struct {
	db *gorm.DB
}

// NewHandler — yangi handler yaratish
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// violationWithUser — violation + user info
type violationWithUser struct {
	models.AntiCheatViolation
	Username  string `json:"username"`
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
}

// List — GET /superadmin/anticheat/violations
// Query params: source_type (olympiad|mock_test), source_id, user_id, violation_type, page, page_size
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	sourceType := c.Query("source_type")
	sourceID := c.Query("source_id")
	userID := c.Query("user_id")
	violationType := c.Query("violation_type")

	q := h.db.Model(&models.AntiCheatViolation{})

	if sourceType != "" {
		q = q.Where("anti_cheat_violations.attempt_type = ?", sourceType)
	}

	// source_id orqali attempt larni topib, ular bo'yicha filter qilish
	if sourceID != "" && sourceType != "" {
		sid, err := strconv.ParseUint(sourceID, 10, 64)
		if err == nil {
			if sourceType == "olympiad" {
				q = q.Where("anti_cheat_violations.attempt_id IN (?)",
					h.db.Table("olympiad_attempt").Select("id").Where("olympiad_id = ?", sid))
			} else if sourceType == "mock_test" {
				q = q.Where("anti_cheat_violations.attempt_id IN (?)",
					h.db.Table("mock_attempt").Select("id").Where("mock_test_id = ?", sid))
			}
		}
	}

	if userID != "" {
		uid, err := strconv.ParseUint(userID, 10, 64)
		if err == nil {
			q = q.Where("anti_cheat_violations.user_id = ?", uid)
		}
	}

	if violationType != "" {
		q = q.Where("anti_cheat_violations.type = ?", violationType)
	}

	var total int64
	q.Count(&total)

	var violations []models.AntiCheatViolation
	q.Order("anti_cheat_violations.created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&violations)

	// User info ni qo'shish
	result := make([]violationWithUser, 0, len(violations))
	userCache := make(map[uint]models.User)

	for _, v := range violations {
		u, ok := userCache[v.UserID]
		if !ok {
			h.db.Select("id, username, full_name, avatar_url").First(&u, v.UserID)
			userCache[v.UserID] = u
		}
		result = append(result, violationWithUser{
			AntiCheatViolation: v,
			Username:           u.Username,
			FullName:           u.FullName,
			AvatarURL:          u.AvatarURL,
		})
	}

	response.SuccessWithPagination(c, http.StatusOK, "Anti-cheat violations", result, page, pageSize, total)
}

// statsResponse — statistika javobi
type statsResponse struct {
	Total          int64            `json:"total"`
	ByType         map[string]int64 `json:"by_type"`
	TopViolators   []topViolator    `json:"top_violators"`
}

type topViolator struct {
	UserID         uint   `json:"user_id"`
	Username       string `json:"username"`
	FullName       string `json:"full_name"`
	ViolationCount int64  `json:"violation_count"`
}

// Stats — GET /superadmin/anticheat/violations/stats
// Query params: source_type, source_id
func (h *Handler) Stats(c *gin.Context) {
	sourceType := c.Query("source_type")
	sourceID := c.Query("source_id")

	q := h.db.Model(&models.AntiCheatViolation{})

	if sourceType != "" {
		q = q.Where("attempt_type = ?", sourceType)
	}

	if sourceID != "" && sourceType != "" {
		sid, err := strconv.ParseUint(sourceID, 10, 64)
		if err == nil {
			if sourceType == "olympiad" {
				q = q.Where("attempt_id IN (?)",
					h.db.Table("olympiad_attempt").Select("id").Where("olympiad_id = ?", sid))
			} else if sourceType == "mock_test" {
				q = q.Where("attempt_id IN (?)",
					h.db.Table("mock_attempt").Select("id").Where("mock_test_id = ?", sid))
			}
		}
	}

	// Total
	var total int64
	q.Count(&total)

	// By type
	type typeCount struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	var typeCounts []typeCount
	q.Select("type, COUNT(*) as count").Group("type").Find(&typeCounts)
	byType := make(map[string]int64)
	for _, tc := range typeCounts {
		byType[tc.Type] = tc.Count
	}

	// Top violators
	type userViolation struct {
		UserID uint  `json:"user_id"`
		Count  int64 `json:"count"`
	}
	var userViolations []userViolation

	topQ := h.db.Model(&models.AntiCheatViolation{})
	if sourceType != "" {
		topQ = topQ.Where("attempt_type = ?", sourceType)
	}
	if sourceID != "" && sourceType != "" {
		sid, err := strconv.ParseUint(sourceID, 10, 64)
		if err == nil {
			if sourceType == "olympiad" {
				topQ = topQ.Where("attempt_id IN (?)",
					h.db.Table("olympiad_attempt").Select("id").Where("olympiad_id = ?", sid))
			} else if sourceType == "mock_test" {
				topQ = topQ.Where("attempt_id IN (?)",
					h.db.Table("mock_attempt").Select("id").Where("mock_test_id = ?", sid))
			}
		}
	}

	topQ.Select("user_id, COUNT(*) as count").
		Group("user_id").
		Order("count DESC").
		Limit(10).
		Find(&userViolations)

	topViolators := make([]topViolator, 0, len(userViolations))
	for _, uv := range userViolations {
		var u models.User
		h.db.Select("id, username, full_name").First(&u, uv.UserID)
		topViolators = append(topViolators, topViolator{
			UserID:         uv.UserID,
			Username:       u.Username,
			FullName:       u.FullName,
			ViolationCount: uv.Count,
		})
	}

	response.Success(c, http.StatusOK, "Anti-cheat stats", statsResponse{
		Total:        total,
		ByType:       byType,
		TopViolators: topViolators,
	})
}
