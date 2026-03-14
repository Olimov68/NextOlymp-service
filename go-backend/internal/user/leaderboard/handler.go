package leaderboard

import (
	"net/http"
	"strconv"
	"time"

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

type LeaderboardEntry struct {
	UserID        uint    `json:"user_id"`
	Username      string  `json:"username"`
	FirstName     string  `json:"first_name"`
	LastName      string  `json:"last_name"`
	FullName      string  `json:"full_name"`
	Region        string  `json:"region"`
	TotalScore    float64 `json:"total_score"`
	AvgPercentage float64 `json:"avg_percentage"`
	AttemptsCount int     `json:"attempts_count"`
	Rank          int     `json:"rank"`
	Medal         string  `json:"medal"`
}

// GetLeaderboard — reyting jadvali
func (h *Handler) GetLeaderboard(c *gin.Context) {
	subject := c.Query("subject")
	region := c.Query("region")
	period := c.DefaultQuery("period", "all")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	baseQuery := h.db.Table("mock_attempts").
		Select(`
			mock_attempts.user_id,
			users.username,
			profiles.first_name,
			profiles.last_name,
			profiles.region,
			SUM(mock_attempts.score) as total_score,
			AVG(mock_attempts.percentage) as avg_percentage,
			COUNT(*) as attempts_count
		`).
		Joins("JOIN users ON users.id = mock_attempts.user_id").
		Joins("JOIN profiles ON profiles.user_id = mock_attempts.user_id").
		Where("mock_attempts.status = ?", "completed")

	// Period filter
	switch period {
	case "weekly":
		baseQuery = baseQuery.Where("mock_attempts.created_at >= ?", time.Now().AddDate(0, 0, -7))
	case "monthly":
		baseQuery = baseQuery.Where("mock_attempts.created_at >= ?", time.Now().AddDate(0, 0, -30))
	}

	// Subject filter
	if subject != "" {
		baseQuery = baseQuery.
			Joins("JOIN mock_tests ON mock_tests.id = mock_attempts.mock_test_id").
			Where("mock_tests.subject = ?", subject)
	}

	// Region filter
	if region != "" {
		baseQuery = baseQuery.Where("profiles.region = ?", region)
	}

	baseQuery = baseQuery.Group("mock_attempts.user_id, users.username, profiles.first_name, profiles.last_name, profiles.region")

	// Count total participants
	var total int64
	countQuery := h.db.Table("(?) as sub", baseQuery).Count(&total)
	if countQuery.Error != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	// Fetch paginated results
	offset := (page - 1) * limit
	var entries []LeaderboardEntry
	err := h.db.Table("(?) as ranked", baseQuery).
		Order("total_score DESC").
		Offset(offset).Limit(limit).
		Find(&entries).Error
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	// Assign rank, medal, and full_name
	for i := range entries {
		entries[i].Rank = offset + i + 1
		entries[i].Medal = medalForRank(entries[i].Rank)
		entries[i].FullName = entries[i].FirstName + " " + entries[i].LastName
	}

	response.Success(c, http.StatusOK, "Leaderboard", gin.H{
		"data":  entries,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetMyRank — joriy foydalanuvchining reyting o'rni
func (h *Handler) GetMyRank(c *gin.Context) {
	userID := c.GetUint("userID")

	subject := c.Query("subject")
	region := c.Query("region")
	period := c.DefaultQuery("period", "all")

	// Build base condition for period
	periodCond := ""
	var periodArgs []interface{}
	switch period {
	case "weekly":
		periodCond = "AND mock_attempts.created_at >= ?"
		periodArgs = append(periodArgs, time.Now().AddDate(0, 0, -7))
	case "monthly":
		periodCond = "AND mock_attempts.created_at >= ?"
		periodArgs = append(periodArgs, time.Now().AddDate(0, 0, -30))
	}

	// Build subject join/condition
	subjectJoin := ""
	subjectCond := ""
	if subject != "" {
		subjectJoin = "JOIN mock_tests ON mock_tests.id = mock_attempts.mock_test_id"
		subjectCond = "AND mock_tests.subject = ?"
		periodArgs = append(periodArgs, subject)
	}

	// Build region condition
	regionCond := ""
	if region != "" {
		regionCond = "AND profiles.region = ?"
		periodArgs = append(periodArgs, region)
	}

	// Get user's aggregate
	type UserStats struct {
		TotalScore    float64 `json:"total_score"`
		AvgPercentage float64 `json:"avg_percentage"`
		AttemptsCount int     `json:"attempts_count"`
	}

	var stats UserStats
	statsQuery := h.db.Table("mock_attempts").
		Select("COALESCE(SUM(score), 0) as total_score, COALESCE(AVG(percentage), 0) as avg_percentage, COUNT(*) as attempts_count").
		Joins("JOIN profiles ON profiles.user_id = mock_attempts.user_id").
		Where("mock_attempts.user_id = ? AND mock_attempts.status = ? "+periodCond+" "+subjectCond+" "+regionCond, append([]interface{}{userID, "completed"}, periodArgs...)...)

	if subjectJoin != "" {
		statsQuery = statsQuery.Joins(subjectJoin)
	}

	if err := statsQuery.Scan(&stats).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Reyting yuklanmadi")
		return
	}

	// Count how many users have a higher total_score (rank = that count + 1)
	rankSubQuery := h.db.Table("mock_attempts").
		Select("mock_attempts.user_id, SUM(mock_attempts.score) as total_score").
		Joins("JOIN profiles ON profiles.user_id = mock_attempts.user_id").
		Where("mock_attempts.status = ? "+periodCond+" "+subjectCond+" "+regionCond, append([]interface{}{"completed"}, periodArgs...)...)

	if subjectJoin != "" {
		rankSubQuery = rankSubQuery.Joins(subjectJoin)
	}

	rankSubQuery = rankSubQuery.Group("mock_attempts.user_id")

	var rank int64
	h.db.Table("(?) as all_users", rankSubQuery).
		Where("all_users.total_score > ?", stats.TotalScore).
		Count(&rank)

	var totalParticipants int64
	h.db.Table("(?) as all_users", rankSubQuery).Count(&totalParticipants)

	myRank := int(rank) + 1
	if stats.AttemptsCount == 0 {
		myRank = 0
	}

	response.Success(c, http.StatusOK, "Mening reytingim", gin.H{
		"rank":               myRank,
		"total_score":        stats.TotalScore,
		"avg_percentage":     stats.AvgPercentage,
		"attempts_count":     stats.AttemptsCount,
		"total_participants": totalParticipants,
	})
}

func medalForRank(rank int) string {
	switch {
	case rank == 1:
		return "gold"
	case rank >= 2 && rank <= 3:
		return "silver"
	case rank >= 4 && rank <= 10:
		return "bronze"
	default:
		return ""
	}
}
