package results

import (
	"fmt"
	"net/http"

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

// GetMyResults — barcha natijalarim
func (h *Handler) GetMyResults(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	sourceType := c.Query("type") // olympiad | mock_test | all

	var mockAttempts []models.MockAttempt
	var olympiadAttempts []models.OlympiadAttempt

	if sourceType == "" || sourceType == "all" || sourceType == "mock_test" {
		h.db.Preload("MockTest").
			Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"}).
			Order("created_at DESC").
			Find(&mockAttempts)
	}

	if sourceType == "" || sourceType == "all" || sourceType == "olympiad" {
		h.db.Preload("Olympiad").
			Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"}).
			Order("created_at DESC").
			Find(&olympiadAttempts)
	}

	type ResultItem struct {
		ID         uint    `json:"id"`
		Type       string  `json:"type"`
		Title      string  `json:"title"`
		Subject    string  `json:"subject"`
		Score      float64 `json:"score"`
		MaxScore   float64 `json:"max_score"`
		Percentage float64 `json:"percentage"`
		Correct    int     `json:"correct"`
		Wrong      int     `json:"wrong"`
		Unanswered int     `json:"unanswered"`
		TimeTaken  int     `json:"time_taken"`
		Status     string  `json:"status"`
		Date       string  `json:"date"`
	}

	var allResults []ResultItem

	for _, a := range mockAttempts {
		title := ""
		subject := ""
		if a.MockTest != nil {
			title = a.MockTest.Title
			subject = a.MockTest.Subject
		}
		allResults = append(allResults, ResultItem{
			ID: a.ID, Type: "mock_test", Title: title, Subject: subject,
			Score: a.Score, MaxScore: a.MaxScore, Percentage: a.Percentage,
			Correct: a.Correct, Wrong: a.Wrong, Unanswered: a.Unanswered,
			TimeTaken: a.TimeTaken, Status: a.Status,
			Date: a.CreatedAt.Format("2006-01-02 15:04"),
		})
	}

	for _, a := range olympiadAttempts {
		title := ""
		subject := ""
		if a.Olympiad != nil {
			title = a.Olympiad.Title
			subject = a.Olympiad.Subject
		}
		allResults = append(allResults, ResultItem{
			ID: a.ID, Type: "olympiad", Title: title, Subject: subject,
			Score: a.Score, MaxScore: a.MaxScore, Percentage: a.Percentage,
			Correct: a.Correct, Wrong: a.Wrong, Unanswered: a.Unanswered,
			TimeTaken: a.TimeTaken, Status: a.Status,
			Date: a.CreatedAt.Format("2006-01-02 15:04"),
		})
	}

	total := int64(len(allResults))
	offset := (page - 1) * limit
	end := offset + limit
	if end > int(total) {
		end = int(total)
	}
	if offset > int(total) {
		offset = int(total)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Natijalar", allResults[offset:end], page, limit, total)
}

// GetMockTestResults — mock test bo'yicha natijalar
func (h *Handler) GetMockTestResults(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)

	var attempts []models.MockAttempt
	h.db.Preload("MockTest").
		Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"}).
		Order("created_at DESC").
		Find(&attempts)

	response.Success(c, http.StatusOK, "Mock test natijalari", attempts)
}

// GetOlympiadResults — olimpiada bo'yicha natijalar
func (h *Handler) GetOlympiadResults(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)

	var attempts []models.OlympiadAttempt
	h.db.Preload("Olympiad").
		Where("user_id = ? AND status IN ?", userID, []string{"completed", "timed_out"}).
		Order("created_at DESC").
		Find(&attempts)

	response.Success(c, http.StatusOK, "Olimpiada natijalari", attempts)
}
