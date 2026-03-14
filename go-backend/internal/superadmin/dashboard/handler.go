package superadmindashboard

import (
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

type SuperAdminStats struct {
	TotalUsers        int64   `json:"total_users"`
	BlockedUsers      int64   `json:"blocked_users"`
	TotalAdmins       int64   `json:"total_admins"`
	TotalOlympiads    int64   `json:"total_olympiads"`
	TotalMockTests    int64   `json:"total_mock_tests"`
	TotalFeedbacks    int64   `json:"total_feedbacks"`
	OpenFeedbacks     int64   `json:"open_feedbacks"`
	TotalPayments     int64   `json:"total_payments"`
	TotalCertificates int64   `json:"total_certificates"`
	ActivePromoCodes  int64   `json:"active_promo_codes"`
	TotalRevenue      float64 `json:"total_revenue"`
	WeeklyNewUsers    int64   `json:"weekly_new_users"`
}

type LatestUser struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type LatestFeedback struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	Subject   string `json:"subject"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type LatestPayment struct {
	ID        uint    `json:"id"`
	UserID    uint    `json:"user_id"`
	Username  string  `json:"username"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// Stats GET /api/v1/superadmin/dashboard
func (h *Handler) Stats(c *gin.Context) {
	var stats SuperAdminStats
	h.db.Raw("SELECT COUNT(*) FROM users WHERE status != 'deleted'").Scan(&stats.TotalUsers)
	h.db.Raw("SELECT COUNT(*) FROM users WHERE status = 'blocked'").Scan(&stats.BlockedUsers)
	h.db.Raw("SELECT COUNT(*) FROM staff_users WHERE role = 'admin'").Scan(&stats.TotalAdmins)
	h.db.Raw("SELECT COUNT(*) FROM olympiads").Scan(&stats.TotalOlympiads)
	h.db.Raw("SELECT COUNT(*) FROM mock_tests").Scan(&stats.TotalMockTests)
	h.db.Raw("SELECT COUNT(*) FROM feedbacks").Scan(&stats.TotalFeedbacks)
	h.db.Raw("SELECT COUNT(*) FROM feedbacks WHERE status = 'open'").Scan(&stats.OpenFeedbacks)
	h.db.Raw("SELECT COUNT(*) FROM payments").Scan(&stats.TotalPayments)
	h.db.Raw("SELECT COUNT(*) FROM certificates").Scan(&stats.TotalCertificates)
	h.db.Raw("SELECT COUNT(*) FROM promo_codes WHERE status = 'active'").Scan(&stats.ActivePromoCodes)
	h.db.Raw("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'").Scan(&stats.TotalRevenue)
	h.db.Raw("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days' AND status != 'deleted'").Scan(&stats.WeeklyNewUsers)

	// Latest users
	var latestUsers []models.User
	h.db.Where("status != ?", "deleted").Order("created_at DESC").Limit(5).Find(&latestUsers)
	users := make([]LatestUser, len(latestUsers))
	for i, u := range latestUsers {
		users[i] = LatestUser{
			ID:        u.ID,
			Username:  u.Username,
			Status:    string(u.Status),
			CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	// Latest feedbacks
	var latestFeedbacks []models.Feedback
	h.db.Preload("User").Order("created_at DESC").Limit(5).Find(&latestFeedbacks)
	feedbacks := make([]LatestFeedback, len(latestFeedbacks))
	for i, f := range latestFeedbacks {
		fb := LatestFeedback{
			ID:        f.ID,
			UserID:    f.UserID,
			Subject:   f.Subject,
			Status:    string(f.Status),
			CreatedAt: f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if f.User != nil {
			fb.Username = f.User.Username
		}
		feedbacks[i] = fb
	}

	// Latest payments
	var latestPayments []models.Payment
	h.db.Preload("User").Order("created_at DESC").Limit(5).Find(&latestPayments)
	payments := make([]LatestPayment, len(latestPayments))
	for i, p := range latestPayments {
		lp := LatestPayment{
			ID:        p.ID,
			UserID:    p.UserID,
			Amount:    p.Amount,
			Status:    string(p.Status),
			CreatedAt: p.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if p.User != nil {
			lp.Username = p.User.Username
		}
		payments[i] = lp
	}

	response.Success(c, http.StatusOK, "SuperAdmin dashboard stats", gin.H{
		"stats":            stats,
		"latest_users":     users,
		"latest_feedbacks": feedbacks,
		"latest_payments":  payments,
	})
}
