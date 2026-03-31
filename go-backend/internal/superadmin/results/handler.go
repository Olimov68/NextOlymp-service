package saresults

import (
	"fmt"
	"math"
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

// List — barcha natijalar (olympiad + mock test)
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	sourceType := c.Query("type")   // olympiad | mock_test
	subject := c.Query("subject")
	userID := c.Query("user_id")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 20 }

	type ResultRow struct {
		ID         uint    `json:"id"`
		UserID     uint    `json:"user_id"`
		Username   string  `json:"username"`
		FullName   string  `json:"full_name"`
		Type       string  `json:"type"`
		SourceID   uint    `json:"source_id"`
		SourceName string  `json:"source_name"`
		Subject    string  `json:"subject"`
		Score      float64 `json:"score"`
		MaxScore   float64 `json:"max_score"`
		Percentage float64 `json:"percentage"`
		Correct    int     `json:"correct"`
		Wrong      int     `json:"wrong"`
		Unanswered int     `json:"unanswered"`
		TimeTaken  int     `json:"time_taken"`
		Rank       int     `json:"rank"`
		Status     string  `json:"status"`
		Date       string  `json:"date"`
	}

	var allResults []ResultRow

	// Mock test natijalari
	if sourceType == "" || sourceType == "mock_test" {
		query := h.db.Model(&models.MockAttempt{}).
			Joins("LEFT JOIN users ON users.id = mock_attempts.user_id").
			Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
			Joins("LEFT JOIN mock_tests ON mock_tests.id = mock_attempts.mock_test_id").
			Where("mock_attempts.status IN ?", []string{"completed", "timed_out"})

		if subject != "" {
			query = query.Where("mock_tests.subject = ?", subject)
		}
		if userID != "" {
			query = query.Where("mock_attempts.user_id = ?", userID)
		}
		if search != "" {
			query = query.Where("users.username ILIKE ? OR profiles.first_name ILIKE ? OR mock_tests.title ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
		}

		var mockResults []struct {
			models.MockAttempt
			Username  string `gorm:"column:username"`
			FirstName string `gorm:"column:first_name"`
			LastName  string `gorm:"column:last_name"`
			Title     string `gorm:"column:title"`
			Subject   string `gorm:"column:subject"`
		}
		query.Select("mock_attempts.*, users.username, profiles.first_name, profiles.last_name, mock_tests.title, mock_tests.subject").
			Find(&mockResults)

		for _, r := range mockResults {
			fullName := ""
			if r.FirstName != "" {
				fullName = r.FirstName + " " + r.LastName
			}
			allResults = append(allResults, ResultRow{
				ID: r.ID, UserID: r.UserID, Username: r.Username, FullName: fullName,
				Type: "mock_test", SourceID: r.MockTestID, SourceName: r.Title, Subject: r.Subject,
				Score: r.Score, MaxScore: r.MaxScore, Percentage: r.Percentage,
				Correct: r.Correct, Wrong: r.Wrong, Unanswered: r.Unanswered,
				TimeTaken: r.TimeTaken, Status: r.Status,
				Date: r.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
	}

	// Olympiad natijalari
	if sourceType == "" || sourceType == "olympiad" {
		query := h.db.Model(&models.OlympiadAttempt{}).
			Joins("LEFT JOIN users ON users.id = olympiad_attempts.user_id").
			Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
			Joins("LEFT JOIN olympiads ON olympiads.id = olympiad_attempts.olympiad_id").
			Where("olympiad_attempts.status IN ?", []string{"completed", "timed_out"})

		if subject != "" {
			query = query.Where("olympiads.subject = ?", subject)
		}
		if userID != "" {
			query = query.Where("olympiad_attempts.user_id = ?", userID)
		}
		if search != "" {
			query = query.Where("users.username ILIKE ? OR profiles.first_name ILIKE ? OR olympiads.title ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
		}

		var olympResults []struct {
			models.OlympiadAttempt
			Username  string `gorm:"column:username"`
			FirstName string `gorm:"column:first_name"`
			LastName  string `gorm:"column:last_name"`
			Title     string `gorm:"column:title"`
			Subject   string `gorm:"column:subject"`
		}
		query.Select("olympiad_attempts.*, users.username, profiles.first_name, profiles.last_name, olympiads.title, olympiads.subject").
			Find(&olympResults)

		for _, r := range olympResults {
			fullName := ""
			if r.FirstName != "" {
				fullName = r.FirstName + " " + r.LastName
			}
			allResults = append(allResults, ResultRow{
				ID: r.ID, UserID: r.UserID, Username: r.Username, FullName: fullName,
				Type: "olympiad", SourceID: r.OlympiadID, SourceName: r.Title, Subject: r.Subject,
				Score: r.Score, MaxScore: r.MaxScore, Percentage: r.Percentage,
				Correct: r.Correct, Wrong: r.Wrong, Unanswered: r.Unanswered,
				TimeTaken: r.TimeTaken, Rank: r.Rank, Status: r.Status,
				Date: r.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
	}

	// Sort va paginate
	total := int64(len(allResults))
	_ = sortBy
	_ = sortOrder
	_ = fmt.Sprintf("") // suppress unused

	offset := (page - 1) * limit
	end := offset + limit
	if end > int(total) { end = int(total) }
	if offset > int(total) { offset = int(total) }

	response.SuccessWithPagination(c, http.StatusOK, "Natijalar", allResults[offset:end], page, limit, total)
}

// GetByID — bitta natija detali
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	resultType := c.Query("type") // olympiad | mock_test

	if resultType == "olympiad" {
		var attempt models.OlympiadAttempt
		if err := h.db.Preload("User").Preload("Olympiad").Preload("Answers.Question.Options").
			First(&attempt, id).Error; err != nil {
			response.Error(c, http.StatusNotFound, "Natija topilmadi")
			return
		}
		response.Success(c, http.StatusOK, "Olympiad natijasi", attempt)
		return
	}

	// Default: mock_test
	var attempt models.MockAttempt
	if err := h.db.Preload("User").Preload("MockTest").Preload("Answers.Question.Options").
		First(&attempt, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Natija topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Mock test natijasi", attempt)
}

// ApproveResult — natijani tasdiqlash (admin_approval uchun)
func (h *Handler) ApproveResult(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	resultType := c.Query("type") // olympiad | mock_test

	if resultType == "olympiad" {
		if err := h.db.Model(&models.OlympiadAttempt{}).Where("id = ?", id).
			Update("result_approved", true).Error; err != nil {
			response.Error(c, http.StatusInternalServerError, "Natijani tasdiqlashda xatolik")
			return
		}
		response.Success(c, http.StatusOK, "Natija tasdiqlandi", nil)
		return
	}

	// Default: mock_test
	if err := h.db.Model(&models.MockAttempt{}).Where("id = ?", id).
		Update("result_approved", true).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Natijani tasdiqlashda xatolik")
		return
	}
	response.Success(c, http.StatusOK, "Natija tasdiqlandi", nil)
}

// BulkApproveResults — bir nechta natijani tasdiqlash
func (h *Handler) BulkApproveResults(c *gin.Context) {
	var req struct {
		IDs  []uint `json:"ids"`
		Type string `json:"type"` // olympiad | mock_test
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ma'lumotlar")
		return
	}

	if req.Type == "olympiad" {
		h.db.Model(&models.OlympiadAttempt{}).Where("id IN ?", req.IDs).Update("result_approved", true)
	} else {
		h.db.Model(&models.MockAttempt{}).Where("id IN ?", req.IDs).Update("result_approved", true)
	}

	response.Success(c, http.StatusOK, "Natijalar tasdiqlandi", nil)
}

// GetOlympiadRanking — olimpiada bo'yicha reyting
func (h *Handler) GetOlympiadRanking(c *gin.Context) {
	olympiadID, err := strconv.ParseUint(c.Param("olympiad_id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	var attempts []models.OlympiadAttempt
	h.db.Preload("User").
		Where("olympiad_id = ? AND status IN ?", olympiadID, []string{"completed", "timed_out"}).
		Order("score DESC, time_taken ASC").
		Find(&attempts)

	// Rank berish
	type RankItem struct {
		Rank       int     `json:"rank"`
		UserID     uint    `json:"user_id"`
		Username   string  `json:"username"`
		Score      float64 `json:"score"`
		MaxScore   float64 `json:"max_score"`
		Percentage float64 `json:"percentage"`
		TimeTaken  int     `json:"time_taken"`
	}

	var ranking []RankItem
	for i, a := range attempts {
		username := ""
		if a.User != nil {
			username = a.User.Username
		}
		ranking = append(ranking, RankItem{
			Rank: i + 1, UserID: a.UserID, Username: username,
			Score: a.Score, MaxScore: a.MaxScore, Percentage: a.Percentage,
			TimeTaken: a.TimeTaken,
		})

		// Rank saqlash
		h.db.Model(&a).Update("rank", i+1)
	}

	response.Success(c, http.StatusOK, "Reyting", ranking)
}

// QuestionAnalytics — savollar tahlili (qaysi savol qiyin, xatolar statistikasi)
func (h *Handler) QuestionAnalytics(c *gin.Context) {
	sourceType := c.Query("type")   // olympiad | mock_test
	sourceID := c.Query("source_id") // olympiad_id yoki mock_test_id

	if sourceType == "" || sourceID == "" {
		response.Error(c, http.StatusBadRequest, "type va source_id majburiy")
		return
	}

	sid, err := strconv.ParseUint(sourceID, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri source_id")
		return
	}

	// Savollarni olish
	var questions []models.Question
	h.db.Preload("Options").
		Where("source_type = ? AND source_id = ? AND is_active = true", sourceType, sid).
		Order("order_num ASC").Find(&questions)

	if len(questions) == 0 {
		response.Success(c, http.StatusOK, "Savollar tahlili", gin.H{
			"questions": []interface{}{},
			"summary":   gin.H{},
		})
		return
	}

	// Javoblarni olish
	type AnswerStat struct {
		QuestionID       uint `gorm:"column:question_id"`
		SelectedOptionID *uint `gorm:"column:selected_option_id"`
		IsCorrect        bool `gorm:"column:is_correct"`
		Count            int  `gorm:"column:cnt"`
	}

	var answerStats []AnswerStat

	if sourceType == "olympiad" {
		h.db.Raw(`
			SELECT oaa.question_id, oaa.selected_option_id, oaa.is_correct, COUNT(*) as cnt
			FROM olympiad_attempt_answer oaa
			JOIN olympiad_attempt oa ON oa.id = oaa.attempt_id
			WHERE oa.olympiad_id = ? AND oa.status IN ('completed','timed_out')
			GROUP BY oaa.question_id, oaa.selected_option_id, oaa.is_correct
		`, sid).Scan(&answerStats)
	} else {
		h.db.Raw(`
			SELECT maa.question_id, maa.selected_option_id, maa.is_correct, COUNT(*) as cnt
			FROM mock_attempt_answer maa
			JOIN mock_attempt ma ON ma.id = maa.attempt_id
			WHERE ma.mock_test_id = ? AND ma.status IN ('completed','timed_out')
			GROUP BY maa.question_id, maa.selected_option_id, maa.is_correct
		`, sid).Scan(&answerStats)
	}

	// Har bir savol uchun statistikani hisoblash
	type QuestionAnalytic struct {
		QuestionID       uint    `json:"question_id"`
		QuestionText     string  `json:"question_text"`
		OrderNum         int     `json:"order_num"`
		Difficulty       string  `json:"difficulty"`
		TotalAnswers     int     `json:"total_answers"`
		CorrectCount     int     `json:"correct_count"`
		IncorrectCount   int     `json:"incorrect_count"`
		SkippedCount     int     `json:"skipped_count"`
		CorrectPercent   float64 `json:"correct_percent"`
		IncorrectPercent float64 `json:"incorrect_percent"`
		MostWrongOption  string  `json:"most_wrong_option"`
		OptionStats      []gin.H `json:"option_stats"`
	}

	var analytics []QuestionAnalytic
	totalCorrectAll := 0
	totalWrongAll := 0

	for _, q := range questions {
		qa := QuestionAnalytic{
			QuestionID:   q.ID,
			QuestionText: q.Text,
			OrderNum:     q.OrderNum,
			Difficulty:   q.Difficulty,
		}

		// Savol uchun barcha javoblarni hisoblash
		optionCounts := make(map[uint]int)
		for _, stat := range answerStats {
			if stat.QuestionID != q.ID {
				continue
			}
			if stat.SelectedOptionID == nil {
				qa.SkippedCount += stat.Count
			} else if stat.IsCorrect {
				qa.CorrectCount += stat.Count
				optionCounts[*stat.SelectedOptionID] += stat.Count
			} else {
				qa.IncorrectCount += stat.Count
				optionCounts[*stat.SelectedOptionID] += stat.Count
			}
		}

		qa.TotalAnswers = qa.CorrectCount + qa.IncorrectCount + qa.SkippedCount
		if qa.TotalAnswers > 0 {
			qa.CorrectPercent = math.Round(float64(qa.CorrectCount)/float64(qa.TotalAnswers)*1000) / 10
			qa.IncorrectPercent = math.Round(float64(qa.IncorrectCount)/float64(qa.TotalAnswers)*1000) / 10
		}

		totalCorrectAll += qa.CorrectCount
		totalWrongAll += qa.IncorrectCount

		// Har bir variant uchun statistika
		var optStats []gin.H
		maxWrongCount := 0
		mostWrongLabel := ""
		for _, opt := range q.Options {
			count := optionCounts[opt.ID]
			pct := 0.0
			if qa.TotalAnswers > 0 {
				pct = math.Round(float64(count)/float64(qa.TotalAnswers)*1000) / 10
			}
			optStats = append(optStats, gin.H{
				"option_id":  opt.ID,
				"label":      opt.Label,
				"text":       opt.Text,
				"is_correct": opt.IsCorrect,
				"count":      count,
				"percent":    pct,
			})
			if !opt.IsCorrect && count > maxWrongCount {
				maxWrongCount = count
				mostWrongLabel = opt.Label
			}
		}
		qa.OptionStats = optStats
		qa.MostWrongOption = mostWrongLabel

		analytics = append(analytics, qa)
	}

	// Umumiy statistika
	totalAttempts := 0
	if sourceType == "olympiad" {
		var count int64
		h.db.Model(&models.OlympiadAttempt{}).Where("olympiad_id = ? AND status IN ('completed','timed_out')", sid).Count(&count)
		totalAttempts = int(count)
	} else {
		var count int64
		h.db.Model(&models.MockAttempt{}).Where("mock_test_id = ? AND status IN ('completed','timed_out')", sid).Count(&count)
		totalAttempts = int(count)
	}

	// Eng qiyin savollar (50% dan kam to'g'ri)
	hardestCount := 0
	for _, qa := range analytics {
		if qa.CorrectPercent < 50 && qa.TotalAnswers > 0 {
			hardestCount++
		}
	}

	response.Success(c, http.StatusOK, "Savollar tahlili", gin.H{
		"questions": analytics,
		"summary": gin.H{
			"total_questions":  len(questions),
			"total_attempts":   totalAttempts,
			"total_correct":    totalCorrectAll,
			"total_incorrect":  totalWrongAll,
			"hardest_questions": hardestCount,
		},
	})
}
