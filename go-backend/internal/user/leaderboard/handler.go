package leaderboard

import (
	"encoding/json"
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

// LeaderboardEntry — reyting jadvalidagi bitta yozuv
type LeaderboardEntry struct {
	Rank           int     `json:"rank"`
	UserID         uint    `json:"user_id"`
	Username       string  `json:"username"`
	FirstName      string  `json:"first_name"`
	LastName       string  `json:"last_name"`
	FullName       string  `json:"full_name"`
	Region         string  `json:"region"`
	Score          float64 `json:"score"`
	Correct        int     `json:"correct"`
	Total          int     `json:"total"`
	Percentage     float64 `json:"percentage"`
	Medal          string  `json:"medal"`
	TotalXP        int64   `json:"total_xp,omitempty"`
	Level          int     `json:"level,omitempty"`
	TestsCompleted int     `json:"tests_completed,omitempty"`
}

// GetLeaderboard — reyting jadvali
// Query params:
//   - type=olympiad&source_id=X  — muayyan olimpiada reytingi
//   - type=overall               — umumiy platforma reytingi
//   - region=Toshkent            — viloyat bo'yicha filter
//   - subject=matematika         — fan bo'yicha filter (overall uchun)
//   - period=weekly|monthly|all  — vaqt oralig'i (overall uchun)
//   - page, limit                — pagination
func (h *Handler) GetLeaderboard(c *gin.Context) {
	leaderboardType := c.DefaultQuery("type", "overall")
	region := c.Query("region")

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

	switch leaderboardType {
	case "olympiad":
		h.getOlympiadLeaderboard(c, region, page, limit)
	case "xp":
		h.getXPLeaderboard(c, region, page, limit)
	default:
		h.getOverallLeaderboard(c, region, page, limit)
	}
}

// getXPLeaderboard — XP/level bo'yicha umumiy reyting (profiles.total_xp)
func (h *Handler) getXPLeaderboard(c *gin.Context, region string, page, limit int) {
	baseQuery := h.db.Table("profile").
		Select(`
			profile.user_id,
			users.username,
			profile.first_name,
			profile.last_name,
			profile.region,
			profile.total_xp,
			profile.level,
			profile.tests_completed,
			profile.current_streak
		`).
		Joins("JOIN users ON users.id = profile.user_id").
		Where("profile.total_xp > 0")

	if region != "" {
		baseQuery = baseQuery.Where("profile.region = ?", region)
	}

	var total int64
	if err := h.db.Table("(?) as sub", baseQuery).Count(&total).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	offset := (page - 1) * limit

	type xpEntry struct {
		UserID         uint   `json:"user_id"`
		Username       string `json:"username"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		Region         string `json:"region"`
		TotalXP        int64  `json:"total_xp"`
		Level          int    `json:"level"`
		TestsCompleted int    `json:"tests_completed"`
		CurrentStreak  int    `json:"current_streak"`
	}

	var rawEntries []xpEntry
	err := baseQuery.
		Order("profile.total_xp DESC, profile.tests_completed DESC").
		Offset(offset).Limit(limit).
		Find(&rawEntries).Error
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	entries := make([]LeaderboardEntry, len(rawEntries))
	for i, r := range rawEntries {
		entries[i] = LeaderboardEntry{
			Rank:           offset + i + 1,
			UserID:         r.UserID,
			Username:       r.Username,
			FirstName:      r.FirstName,
			LastName:       r.LastName,
			FullName:       r.FirstName + " " + r.LastName,
			Region:         r.Region,
			Score:          float64(r.TotalXP),
			TotalXP:        r.TotalXP,
			Level:          r.Level,
			TestsCompleted: r.TestsCompleted,
			Medal:          medalForRank(offset + i + 1),
		}
	}

	response.Success(c, http.StatusOK, "XP Leaderboard", gin.H{
		"data":  entries,
		"total": total,
		"page":  page,
		"limit": limit,
		"type":  "xp",
	})
}

// getOlympiadLeaderboard — muayyan olimpiada bo'yicha reyting
func (h *Handler) getOlympiadLeaderboard(c *gin.Context, region string, page, limit int) {
	sourceIDStr := c.Query("source_id")
	if sourceIDStr == "" {
		response.Error(c, http.StatusBadRequest, "source_id talab qilinadi")
		return
	}
	sourceID, err := strconv.ParseUint(sourceIDStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri source_id")
		return
	}

	// Olimpiadani olish (scoring_rules uchun)
	var olympiad models.Olympiad
	if err := h.db.First(&olympiad, sourceID).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Olimpiada topilmadi")
		return
	}

	// ScoringRules ni parse qilish
	scoringRules := parseScoringRules(olympiad.ScoringRules)

	// Total questions
	totalQuestions := olympiad.TotalQuestions

	baseQuery := h.db.Table("olympiad_attempt").
		Select(`
			olympiad_attempt.user_id,
			users.username,
			profiles.first_name,
			profiles.last_name,
			profiles.region,
			olympiad_attempt.score,
			olympiad_attempt.correct,
			olympiad_attempt.percentage
		`).
		Joins("JOIN users ON users.id = olympiad_attempt.user_id").
		Joins("JOIN profiles ON profiles.user_id = olympiad_attempt.user_id").
		Where("olympiad_attempt.olympiad_id = ? AND olympiad_attempt.status IN ?", sourceID, []string{"completed", "timed_out"})

	if region != "" {
		baseQuery = baseQuery.Where("profiles.region = ?", region)
	}

	// Count
	var total int64
	if err := h.db.Table("(?) as sub", baseQuery).Count(&total).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	// Fetch
	offset := (page - 1) * limit

	type rawEntry struct {
		UserID     uint    `json:"user_id"`
		Username   string  `json:"username"`
		FirstName  string  `json:"first_name"`
		LastName   string  `json:"last_name"`
		Region     string  `json:"region"`
		Score      float64 `json:"score"`
		Correct    int     `json:"correct"`
		Percentage float64 `json:"percentage"`
	}

	var rawEntries []rawEntry
	err = h.db.Table("(?) as ranked", baseQuery).
		Order("score DESC, percentage DESC").
		Offset(offset).Limit(limit).
		Find(&rawEntries).Error
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	entries := make([]LeaderboardEntry, len(rawEntries))
	for i, r := range rawEntries {
		score := r.Score
		// Agar scoring rules belgilangan bo'lsa, ballni qayta hisoblash
		if len(scoringRules) > 0 {
			if mappedScore, ok := scoringRules[r.Correct]; ok {
				score = mappedScore
			}
		}
		entries[i] = LeaderboardEntry{
			Rank:       offset + i + 1,
			UserID:     r.UserID,
			Username:   r.Username,
			FirstName:  r.FirstName,
			LastName:   r.LastName,
			FullName:   r.FirstName + " " + r.LastName,
			Region:     r.Region,
			Score:      score,
			Correct:    r.Correct,
			Total:      totalQuestions,
			Percentage: r.Percentage,
			Medal:      medalForRank(offset + i + 1),
		}
	}

	response.Success(c, http.StatusOK, "Olympiad Leaderboard", gin.H{
		"data":        entries,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"olympiad_id": sourceID,
	})
}

// getOverallLeaderboard — umumiy platforma reytingi (olympiad + mock test)
func (h *Handler) getOverallLeaderboard(c *gin.Context, region string, page, limit int) {
	subject := c.Query("subject")
	period := c.DefaultQuery("period", "all")

	// Olympiad attempts
	olympiadQuery := h.db.Table("olympiad_attempt").
		Select(`
			olympiad_attempt.user_id,
			SUM(olympiad_attempt.score) as total_score,
			AVG(olympiad_attempt.percentage) as avg_percentage,
			COUNT(*) as attempts_count
		`).
		Joins("JOIN profiles ON profiles.user_id = olympiad_attempt.user_id").
		Where("olympiad_attempt.status IN ?", []string{"completed", "timed_out"})

	// Mock attempts
	mockQuery := h.db.Table("mock_attempts").
		Select(`
			mock_attempts.user_id,
			SUM(mock_attempts.score) as total_score,
			AVG(mock_attempts.percentage) as avg_percentage,
			COUNT(*) as attempts_count
		`).
		Joins("JOIN profiles ON profiles.user_id = mock_attempts.user_id").
		Where("mock_attempts.status IN ?", []string{"completed", "timed_out"})

	// Period filter
	switch period {
	case "weekly":
		cutoff := time.Now().AddDate(0, 0, -7)
		olympiadQuery = olympiadQuery.Where("olympiad_attempt.created_at >= ?", cutoff)
		mockQuery = mockQuery.Where("mock_attempts.created_at >= ?", cutoff)
	case "monthly":
		cutoff := time.Now().AddDate(0, 0, -30)
		olympiadQuery = olympiadQuery.Where("olympiad_attempt.created_at >= ?", cutoff)
		mockQuery = mockQuery.Where("mock_attempts.created_at >= ?", cutoff)
	}

	// Subject filter
	if subject != "" {
		olympiadQuery = olympiadQuery.
			Joins("JOIN olympiad ON olympiad.id = olympiad_attempt.olympiad_id").
			Where("olympiad.subject = ?", subject)
		mockQuery = mockQuery.
			Joins("JOIN mock_tests ON mock_tests.id = mock_attempts.mock_test_id").
			Where("mock_tests.subject = ?", subject)
	}

	// Region filter
	if region != "" {
		olympiadQuery = olympiadQuery.Where("profiles.region = ?", region)
		mockQuery = mockQuery.Where("profiles.region = ?", region)
	}

	olympiadQuery = olympiadQuery.Group("olympiad_attempt.user_id")
	mockQuery = mockQuery.Group("mock_attempts.user_id")

	// Combined query using UNION via raw SQL subquery approach
	// We'll use a simpler approach: query both separately and merge in Go
	// OR use a combined GORM approach

	// Combined: query with COALESCE from both sources
	combinedQuery := h.db.Table("users").
		Select(`
			users.id as user_id,
			users.username,
			profiles.first_name,
			profiles.last_name,
			profiles.region,
			COALESCE(oa.total_score, 0) + COALESCE(ma.total_score, 0) as total_score,
			CASE
				WHEN COALESCE(oa.attempts_count, 0) + COALESCE(ma.attempts_count, 0) > 0
				THEN (COALESCE(oa.avg_pct_sum, 0) + COALESCE(ma.avg_pct_sum, 0)) / (COALESCE(oa.attempts_count, 0) + COALESCE(ma.attempts_count, 0))
				ELSE 0
			END as avg_percentage,
			COALESCE(oa.attempts_count, 0) + COALESCE(ma.attempts_count, 0) as attempts_count
		`).
		Joins("JOIN profiles ON profiles.user_id = users.id").
		Joins(`LEFT JOIN (
			SELECT olympiad_attempt.user_id,
				SUM(olympiad_attempt.score) as total_score,
				SUM(olympiad_attempt.percentage) as avg_pct_sum,
				COUNT(*) as attempts_count
			FROM olympiad_attempt
			`+h.buildOlympiadWhere(period, subject, region)+`
			GROUP BY olympiad_attempt.user_id
		) oa ON oa.user_id = users.id`).
		Joins(`LEFT JOIN (
			SELECT mock_attempts.user_id,
				SUM(mock_attempts.score) as total_score,
				SUM(mock_attempts.percentage) as avg_pct_sum,
				COUNT(*) as attempts_count
			FROM mock_attempts
			`+h.buildMockWhere(period, subject, region)+`
			GROUP BY mock_attempts.user_id
		) ma ON ma.user_id = users.id`).
		Where("COALESCE(oa.attempts_count, 0) + COALESCE(ma.attempts_count, 0) > 0")

	if region != "" {
		combinedQuery = combinedQuery.Where("profiles.region = ?", region)
	}

	// Count total
	var total int64
	if err := h.db.Table("(?) as sub", combinedQuery).Count(&total).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	// Fetch paginated
	offset := (page - 1) * limit

	type overallEntry struct {
		UserID        uint    `json:"user_id"`
		Username      string  `json:"username"`
		FirstName     string  `json:"first_name"`
		LastName      string  `json:"last_name"`
		Region        string  `json:"region"`
		TotalScore    float64 `json:"total_score"`
		AvgPercentage float64 `json:"avg_percentage"`
		AttemptsCount int     `json:"attempts_count"`
	}

	var rawEntries []overallEntry
	err := h.db.Table("(?) as ranked", combinedQuery).
		Order("total_score DESC, avg_percentage DESC").
		Offset(offset).Limit(limit).
		Find(&rawEntries).Error
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Leaderboard yuklanmadi")
		return
	}

	entries := make([]LeaderboardEntry, len(rawEntries))
	for i, r := range rawEntries {
		entries[i] = LeaderboardEntry{
			Rank:       offset + i + 1,
			UserID:     r.UserID,
			Username:   r.Username,
			FirstName:  r.FirstName,
			LastName:   r.LastName,
			FullName:   r.FirstName + " " + r.LastName,
			Region:     r.Region,
			Score:      r.TotalScore,
			Percentage: r.AvgPercentage,
			Medal:      medalForRank(offset + i + 1),
		}
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
	leaderboardType := c.DefaultQuery("type", "overall")
	region := c.Query("region")

	switch leaderboardType {
	case "olympiad":
		h.getMyOlympiadRank(c, userID, region)
	case "xp":
		h.getMyXPRank(c, userID, region)
	default:
		h.getMyOverallRank(c, userID, region)
	}
}

// getMyXPRank — XP/level reytingidagi joriy o'rin
func (h *Handler) getMyXPRank(c *gin.Context, userID uint, region string) {
	var profile models.Profile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		response.Success(c, http.StatusOK, "Mening reytingim", gin.H{
			"rank":               0,
			"total_xp":           0,
			"level":              1,
			"tests_completed":    0,
			"current_streak":     0,
			"total_participants": 0,
			"message":            "Profile topilmadi",
		})
		return
	}

	rankQuery := h.db.Table("profile").
		Where("total_xp > ?", profile.TotalXP)
	if region != "" {
		rankQuery = rankQuery.Where("region = ?", region)
	}
	var higher int64
	rankQuery.Count(&higher)

	totalQuery := h.db.Table("profile").Where("total_xp > 0")
	if region != "" {
		totalQuery = totalQuery.Where("region = ?", region)
	}
	var totalParticipants int64
	totalQuery.Count(&totalParticipants)

	var user models.User
	h.db.First(&user, userID)

	myRank := int(higher) + 1
	if profile.TotalXP == 0 {
		myRank = 0
	}

	response.Success(c, http.StatusOK, "Mening XP reytingim", gin.H{
		"rank":               myRank,
		"user_id":            userID,
		"username":           user.Username,
		"first_name":         profile.FirstName,
		"last_name":          profile.LastName,
		"region":             profile.Region,
		"total_xp":           profile.TotalXP,
		"level":              profile.Level,
		"tests_completed":    profile.TestsCompleted,
		"current_streak":     profile.CurrentStreak,
		"best_streak":        profile.BestStreak,
		"total_participants": totalParticipants,
	})
}

// getMyOlympiadRank — foydalanuvchining muayyan olimpiadadagi o'rni
func (h *Handler) getMyOlympiadRank(c *gin.Context, userID uint, region string) {
	sourceIDStr := c.Query("source_id")
	if sourceIDStr == "" {
		response.Error(c, http.StatusBadRequest, "source_id talab qilinadi")
		return
	}
	sourceID, err := strconv.ParseUint(sourceIDStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri source_id")
		return
	}

	// Foydalanuvchining natijasini olish
	var attempt models.OlympiadAttempt
	if err := h.db.Where("user_id = ? AND olympiad_id = ? AND status IN ?", userID, sourceID, []string{"completed", "timed_out"}).
		Order("score DESC").First(&attempt).Error; err != nil {
		response.Success(c, http.StatusOK, "Mening reytingim", gin.H{
			"rank":               0,
			"score":              0,
			"percentage":         0,
			"correct":            0,
			"total_participants": 0,
			"message":            "Siz bu olimpiadada hali qatnashmadingiz",
		})
		return
	}

	// Undan yuqori ballga ega bo'lganlar sonini hisoblash
	rankQuery := h.db.Table("olympiad_attempt").
		Joins("JOIN profiles ON profiles.user_id = olympiad_attempt.user_id").
		Where("olympiad_attempt.olympiad_id = ? AND olympiad_attempt.status IN ? AND (olympiad_attempt.score > ? OR (olympiad_attempt.score = ? AND olympiad_attempt.percentage > ?))",
			sourceID, []string{"completed", "timed_out"}, attempt.Score, attempt.Score, attempt.Percentage)

	if region != "" {
		rankQuery = rankQuery.Where("profiles.region = ?", region)
	}

	var rank int64
	rankQuery.Count(&rank)

	// Umumiy ishtirokchilar soni
	totalQuery := h.db.Table("olympiad_attempt").
		Joins("JOIN profiles ON profiles.user_id = olympiad_attempt.user_id").
		Where("olympiad_attempt.olympiad_id = ? AND olympiad_attempt.status IN ?", sourceID, []string{"completed", "timed_out"})

	if region != "" {
		totalQuery = totalQuery.Where("profiles.region = ?", region)
	}

	var totalParticipants int64
	totalQuery.Count(&totalParticipants)

	// Profile ma'lumotlari
	var profile models.Profile
	h.db.Where("user_id = ?", userID).First(&profile)
	var user models.User
	h.db.First(&user, userID)

	// Olympiad scoring rules
	var olympiad models.Olympiad
	h.db.First(&olympiad, sourceID)
	score := attempt.Score
	scoringRules := parseScoringRules(olympiad.ScoringRules)
	if len(scoringRules) > 0 {
		if mappedScore, ok := scoringRules[attempt.Correct]; ok {
			score = mappedScore
		}
	}

	response.Success(c, http.StatusOK, "Mening reytingim", gin.H{
		"rank":               int(rank) + 1,
		"user_id":            userID,
		"username":           user.Username,
		"first_name":         profile.FirstName,
		"last_name":          profile.LastName,
		"region":             profile.Region,
		"score":              score,
		"correct":            attempt.Correct,
		"total":              olympiad.TotalQuestions,
		"percentage":         attempt.Percentage,
		"total_participants": totalParticipants,
	})
}

// getMyOverallRank — umumiy reytingdagi o'rni
func (h *Handler) getMyOverallRank(c *gin.Context, userID uint, region string) {
	period := c.DefaultQuery("period", "all")
	subject := c.Query("subject")

	// Foydalanuvchining umumiy ballini hisoblash
	var olympiadScore float64
	var mockScore float64

	oQuery := h.db.Table("olympiad_attempt").
		Select("COALESCE(SUM(score), 0)").
		Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"})
	mQuery := h.db.Table("mock_attempts").
		Select("COALESCE(SUM(score), 0)").
		Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"})

	switch period {
	case "weekly":
		cutoff := time.Now().AddDate(0, 0, -7)
		oQuery = oQuery.Where("created_at >= ?", cutoff)
		mQuery = mQuery.Where("created_at >= ?", cutoff)
	case "monthly":
		cutoff := time.Now().AddDate(0, 0, -30)
		oQuery = oQuery.Where("created_at >= ?", cutoff)
		mQuery = mQuery.Where("created_at >= ?", cutoff)
	}

	if subject != "" {
		oQuery = oQuery.Joins("JOIN olympiad ON olympiad.id = olympiad_attempt.olympiad_id").Where("olympiad.subject = ?", subject)
		mQuery = mQuery.Joins("JOIN mock_tests ON mock_tests.id = mock_attempts.mock_test_id").Where("mock_tests.subject = ?", subject)
	}

	oQuery.Row().Scan(&olympiadScore)
	mQuery.Row().Scan(&mockScore)

	totalScore := olympiadScore + mockScore

	// Undan yuqori ball olganlar soni (rank hisoblash)
	rankSQL := `
		SELECT COUNT(*) FROM (
			SELECT users.id,
				COALESCE(oa.ts, 0) + COALESCE(ma.ts, 0) as total
			FROM users
			JOIN profiles ON profiles.user_id = users.id
			LEFT JOIN (
				SELECT user_id, SUM(score) as ts FROM olympiad_attempt
				` + h.buildOlympiadWhere(period, subject, region) + `
				GROUP BY user_id
			) oa ON oa.user_id = users.id
			LEFT JOIN (
				SELECT user_id, SUM(score) as ts FROM mock_attempts
				` + h.buildMockWhere(period, subject, region) + `
				GROUP BY user_id
			) ma ON ma.user_id = users.id
			WHERE COALESCE(oa.ts, 0) + COALESCE(ma.ts, 0) > ?
			` + h.buildRegionWhere(region) + `
		) as higher
	`

	var rank int64
	h.db.Raw(rankSQL, totalScore).Scan(&rank)

	// Umumiy ishtirokchilar
	totalSQL := `
		SELECT COUNT(*) FROM (
			SELECT users.id
			FROM users
			JOIN profiles ON profiles.user_id = users.id
			LEFT JOIN (
				SELECT user_id, SUM(score) as ts FROM olympiad_attempt
				` + h.buildOlympiadWhere(period, subject, region) + `
				GROUP BY user_id
			) oa ON oa.user_id = users.id
			LEFT JOIN (
				SELECT user_id, SUM(score) as ts FROM mock_attempts
				` + h.buildMockWhere(period, subject, region) + `
				GROUP BY user_id
			) ma ON ma.user_id = users.id
			WHERE COALESCE(oa.ts, 0) + COALESCE(ma.ts, 0) > 0
			` + h.buildRegionWhere(region) + `
		) as all_users
	`

	var totalParticipants int64
	h.db.Raw(totalSQL).Scan(&totalParticipants)

	myRank := int(rank) + 1
	if totalScore == 0 {
		myRank = 0
	}

	// Profile
	var profile models.Profile
	h.db.Where("user_id = ?", userID).First(&profile)
	var user models.User
	h.db.First(&user, userID)

	response.Success(c, http.StatusOK, "Mening reytingim", gin.H{
		"rank":               myRank,
		"user_id":            userID,
		"username":           user.Username,
		"first_name":         profile.FirstName,
		"last_name":          profile.LastName,
		"region":             profile.Region,
		"total_score":        totalScore,
		"total_participants": totalParticipants,
	})
}

// ============================================
// HELPER FUNKSIYALAR
// ============================================

// buildOlympiadWhere — olympiad_attempt uchun WHERE clause
func (h *Handler) buildOlympiadWhere(period, subject, region string) string {
	where := "WHERE olympiad_attempt.status IN ('completed', 'timed_out')"
	switch period {
	case "weekly":
		where += " AND olympiad_attempt.created_at >= NOW() - INTERVAL '7 days'"
	case "monthly":
		where += " AND olympiad_attempt.created_at >= NOW() - INTERVAL '30 days'"
	}
	if subject != "" {
		where += " AND olympiad_attempt.olympiad_id IN (SELECT id FROM olympiad WHERE subject = '" + escapeSQLString(subject) + "')"
	}
	return where
}

// buildMockWhere — mock_attempts uchun WHERE clause
func (h *Handler) buildMockWhere(period, subject, region string) string {
	where := "WHERE mock_attempts.status IN ('completed', 'timed_out')"
	switch period {
	case "weekly":
		where += " AND mock_attempts.created_at >= NOW() - INTERVAL '7 days'"
	case "monthly":
		where += " AND mock_attempts.created_at >= NOW() - INTERVAL '30 days'"
	}
	if subject != "" {
		where += " AND mock_attempts.mock_test_id IN (SELECT id FROM mock_tests WHERE subject = '" + escapeSQLString(subject) + "')"
	}
	return where
}

// buildRegionWhere — region filter uchun WHERE clause
func (h *Handler) buildRegionWhere(region string) string {
	if region == "" {
		return ""
	}
	return " AND profiles.region = '" + escapeSQLString(region) + "'"
}

// escapeSQLString — oddiy SQL injection himoya (faqat single quote escape)
func escapeSQLString(s string) string {
	result := ""
	for _, c := range s {
		if c == '\'' {
			result += "''"
		} else {
			result += string(c)
		}
	}
	return result
}

// parseScoringRules — JSON scoring rules ni parse qilish
// Format: {"30": 10, "28": 8, "25": 6, ...} — to'g'ri javoblar soni → ball
func parseScoringRules(rulesJSON string) map[int]float64 {
	if rulesJSON == "" {
		return nil
	}
	var raw map[string]float64
	if err := json.Unmarshal([]byte(rulesJSON), &raw); err != nil {
		return nil
	}
	result := make(map[int]float64)
	for k, v := range raw {
		if num, err := strconv.Atoi(k); err == nil {
			result[num] = v
		}
	}
	return result
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
