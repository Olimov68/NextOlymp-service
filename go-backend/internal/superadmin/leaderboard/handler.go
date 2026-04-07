package saleaderboard

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// Entry — superadmin reyting jadvalidagi bitta yozuv
type Entry struct {
	Rank           int    `json:"rank"`
	UserID         uint   `json:"user_id"`
	Username       string `json:"username"`
	FullName       string `json:"full_name"`
	Region         string `json:"region"`
	PhotoURL       string `json:"photo_url"`
	TotalXP        int64  `json:"total_xp"`
	Level          int    `json:"level"`
	TestsCompleted int    `json:"tests_completed"`
	CurrentStreak  int    `json:"current_streak"`
	BestStreak     int    `json:"best_streak"`
}

// List — barcha foydalanuvchilarni XP/level bo'yicha sortlangan reyting holida qaytaradi.
//
//	GET /api/v1/superadmin/leaderboard?page=1&limit=20&search=ali&region=Toshkent
//
// Sortlash: profile.total_xp DESC, tests_completed DESC.
// `total_xp = 0` bo'lgan foydalanuvchilar ham ro'yxatga kiradi
// (ular pastda bo'ladi, shunda staff hech kim test yechmaganini ko'ra oladi).
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 200 {
		limit = 20
	}

	search := c.Query("search")
	region := c.Query("region")

	base := h.db.Table("profile").
		Select(`
			profile.user_id,
			users.username,
			profile.first_name,
			profile.last_name,
			profile.region,
			profile.photo_url,
			profile.total_xp,
			profile.level,
			profile.tests_completed,
			profile.current_streak,
			profile.best_streak
		`).
		Joins("JOIN users ON users.id = profile.user_id")

	if region != "" {
		base = base.Where("profile.region = ?", region)
	}
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(
			"users.username ILIKE ? OR profile.first_name ILIKE ? OR profile.last_name ILIKE ?",
			like, like, like,
		)
	}

	var total int64
	if err := h.db.Table("(?) as sub", base).Count(&total).Error; err != nil {
		response.InternalError(c)
		return
	}

	offset := (page - 1) * limit

	type row struct {
		UserID         uint   `json:"user_id"`
		Username       string `json:"username"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		Region         string `json:"region"`
		PhotoURL       string `json:"photo_url"`
		TotalXP        int64  `json:"total_xp"`
		Level          int    `json:"level"`
		TestsCompleted int    `json:"tests_completed"`
		CurrentStreak  int    `json:"current_streak"`
		BestStreak     int    `json:"best_streak"`
	}

	var rows []row
	if err := base.
		Order("profile.total_xp DESC, profile.tests_completed DESC, profile.user_id ASC").
		Offset(offset).Limit(limit).
		Find(&rows).Error; err != nil {
		response.InternalError(c)
		return
	}

	entries := make([]Entry, len(rows))
	for i, r := range rows {
		entries[i] = Entry{
			Rank:           offset + i + 1,
			UserID:         r.UserID,
			Username:       r.Username,
			FullName:       r.FirstName + " " + r.LastName,
			Region:         r.Region,
			PhotoURL:       r.PhotoURL,
			TotalXP:        r.TotalXP,
			Level:          r.Level,
			TestsCompleted: r.TestsCompleted,
			CurrentStreak:  r.CurrentStreak,
			BestStreak:     r.BestStreak,
		}
	}

	response.Success(c, http.StatusOK, "Leaderboard", gin.H{
		"data":      entries,
		"total":     total,
		"page":      page,
		"page_size": limit,
	})
}
