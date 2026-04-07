// Package saapprovals — adminApproval va manualReview kerak bo'lgan
// pending registratsiya va attemptlarni boshqarish uchun superadmin endpointlari.
package saapprovals

import (
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

// ─── Pending Registrations (admin_approval) ───────────────────────────

// ListPendingMockRegistrations — admin tasdig'ini kutayotgan mock test ro'yxatdan o'tishlar
// GET /api/v1/superadmin/approvals/mock-registrations
func (h *Handler) ListPendingMockRegistrations(c *gin.Context) {
	type row struct {
		ID         uint   `json:"id"`
		UserID     uint   `json:"user_id"`
		Username   string `json:"username"`
		FullName   string `json:"full_name"`
		MockTestID uint   `json:"mock_test_id"`
		MockTitle  string `json:"mock_title"`
		Status     string `json:"status"`
		JoinedAt   string `json:"joined_at"`
	}
	var rows []row
	h.db.Table("mock_test_registration").
		Select(`
			mock_test_registration.id,
			mock_test_registration.user_id,
			"user".username,
			profile.first_name || ' ' || profile.last_name as full_name,
			mock_test_registration.mock_test_id,
			mock_test.title as mock_title,
			mock_test_registration.status,
			mock_test_registration.joined_at::text as joined_at
		`).
		Joins(`JOIN "user" ON "user".id = mock_test_registration.user_id`).
		Joins(`LEFT JOIN profile ON profile.user_id = mock_test_registration.user_id`).
		Joins(`JOIN mock_test ON mock_test.id = mock_test_registration.mock_test_id`).
		Where("mock_test_registration.status = ?", "pending_approval").
		Order("mock_test_registration.joined_at DESC").
		Find(&rows)

	response.Success(c, http.StatusOK, "Pending mock test registrations", gin.H{
		"data":  rows,
		"total": len(rows),
	})
}

// ApproveMockRegistration — mock test ro'yxatdan o'tishni tasdiqlash
// POST /api/v1/superadmin/approvals/mock-registrations/:id/approve
func (h *Handler) ApproveMockRegistration(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.MockTestRegistration{}).
		Where("id = ? AND status = ?", id, "pending_approval").
		Update("status", string(models.MockTestRegStatusRegistered))
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending registration topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Tasdiqlandi", gin.H{"id": id, "status": "registered"})
}

// RejectMockRegistration — mock test ro'yxatdan o'tishni rad etish
// POST /api/v1/superadmin/approvals/mock-registrations/:id/reject
func (h *Handler) RejectMockRegistration(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.MockTestRegistration{}).
		Where("id = ? AND status = ?", id, "pending_approval").
		Update("status", string(models.MockTestRegStatusRejected))
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending registration topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Rad etildi", gin.H{"id": id, "status": "rejected"})
}

// ListPendingOlympiadRegistrations — admin tasdig'ini kutayotgan olimpiada ro'yxatdan o'tishlar
// GET /api/v1/superadmin/approvals/olympiad-registrations
func (h *Handler) ListPendingOlympiadRegistrations(c *gin.Context) {
	type row struct {
		ID            uint   `json:"id"`
		UserID        uint   `json:"user_id"`
		Username      string `json:"username"`
		FullName      string `json:"full_name"`
		OlympiadID    uint   `json:"olympiad_id"`
		OlympiadTitle string `json:"olympiad_title"`
		Status        string `json:"status"`
		JoinedAt      string `json:"joined_at"`
	}
	var rows []row
	h.db.Table("olympiad_registration").
		Select(`
			olympiad_registration.id,
			olympiad_registration.user_id,
			"user".username,
			profile.first_name || ' ' || profile.last_name as full_name,
			olympiad_registration.olympiad_id,
			olympiad.title as olympiad_title,
			olympiad_registration.status,
			olympiad_registration.joined_at::text as joined_at
		`).
		Joins(`JOIN "user" ON "user".id = olympiad_registration.user_id`).
		Joins(`LEFT JOIN profile ON profile.user_id = olympiad_registration.user_id`).
		Joins(`JOIN olympiad ON olympiad.id = olympiad_registration.olympiad_id`).
		Where("olympiad_registration.status = ?", "pending_approval").
		Order("olympiad_registration.joined_at DESC").
		Find(&rows)

	response.Success(c, http.StatusOK, "Pending olympiad registrations", gin.H{
		"data":  rows,
		"total": len(rows),
	})
}

// ApproveOlympiadRegistration POST /api/v1/superadmin/approvals/olympiad-registrations/:id/approve
func (h *Handler) ApproveOlympiadRegistration(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.OlympiadRegistration{}).
		Where("id = ? AND status = ?", id, "pending_approval").
		Update("status", string(models.OlympiadRegStatusRegistered))
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending registration topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Tasdiqlandi", gin.H{"id": id, "status": "registered"})
}

// RejectOlympiadRegistration POST /api/v1/superadmin/approvals/olympiad-registrations/:id/reject
func (h *Handler) RejectOlympiadRegistration(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.OlympiadRegistration{}).
		Where("id = ? AND status = ?", id, "pending_approval").
		Update("status", string(models.OlympiadRegStatusRejected))
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending registration topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Rad etildi", gin.H{"id": id, "status": "rejected"})
}

// ─── Pending Attempts (manual_review) ─────────────────────────────────

// ListPendingMockAttempts — admin tasdig'ini kutayotgan mock test attemptlari
// GET /api/v1/superadmin/approvals/mock-attempts
func (h *Handler) ListPendingMockAttempts(c *gin.Context) {
	type row struct {
		ID         uint    `json:"id"`
		UserID     uint    `json:"user_id"`
		Username   string  `json:"username"`
		FullName   string  `json:"full_name"`
		MockTestID uint    `json:"mock_test_id"`
		MockTitle  string  `json:"mock_title"`
		Score      float64 `json:"score"`
		MaxScore   float64 `json:"max_score"`
		Percentage float64 `json:"percentage"`
		FinishedAt string  `json:"finished_at"`
	}
	var rows []row
	h.db.Table("mock_attempt").
		Select(`
			mock_attempt.id,
			mock_attempt.user_id,
			"user".username,
			profile.first_name || ' ' || profile.last_name as full_name,
			mock_attempt.mock_test_id,
			mock_test.title as mock_title,
			mock_attempt.score,
			mock_attempt.max_score,
			mock_attempt.percentage,
			mock_attempt.finished_at::text as finished_at
		`).
		Joins(`JOIN "user" ON "user".id = mock_attempt.user_id`).
		Joins(`LEFT JOIN profile ON profile.user_id = mock_attempt.user_id`).
		Joins(`JOIN mock_test ON mock_test.id = mock_attempt.mock_test_id`).
		Where("mock_attempt.status = ?", "pending_review").
		Order("mock_attempt.finished_at DESC").
		Find(&rows)

	response.Success(c, http.StatusOK, "Pending mock attempts", gin.H{
		"data":  rows,
		"total": len(rows),
	})
}

// ApproveMockAttempt POST /api/v1/superadmin/approvals/mock-attempts/:id/approve
func (h *Handler) ApproveMockAttempt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.MockAttempt{}).
		Where("id = ? AND status = ?", id, "pending_review").
		Update("status", "completed")
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending attempt topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Tasdiqlandi", gin.H{"id": id, "status": "completed"})
}

// ListPendingOlympiadAttempts GET /api/v1/superadmin/approvals/olympiad-attempts
func (h *Handler) ListPendingOlympiadAttempts(c *gin.Context) {
	type row struct {
		ID            uint    `json:"id"`
		UserID        uint    `json:"user_id"`
		Username      string  `json:"username"`
		FullName      string  `json:"full_name"`
		OlympiadID    uint    `json:"olympiad_id"`
		OlympiadTitle string  `json:"olympiad_title"`
		Score         float64 `json:"score"`
		MaxScore      float64 `json:"max_score"`
		Percentage    float64 `json:"percentage"`
		FinishedAt    string  `json:"finished_at"`
	}
	var rows []row
	h.db.Table("olympiad_attempt").
		Select(`
			olympiad_attempt.id,
			olympiad_attempt.user_id,
			"user".username,
			profile.first_name || ' ' || profile.last_name as full_name,
			olympiad_attempt.olympiad_id,
			olympiad.title as olympiad_title,
			olympiad_attempt.score,
			olympiad_attempt.max_score,
			olympiad_attempt.percentage,
			olympiad_attempt.finished_at::text as finished_at
		`).
		Joins(`JOIN "user" ON "user".id = olympiad_attempt.user_id`).
		Joins(`LEFT JOIN profile ON profile.user_id = olympiad_attempt.user_id`).
		Joins(`JOIN olympiad ON olympiad.id = olympiad_attempt.olympiad_id`).
		Where("olympiad_attempt.status = ?", "pending_review").
		Order("olympiad_attempt.finished_at DESC").
		Find(&rows)

	response.Success(c, http.StatusOK, "Pending olympiad attempts", gin.H{
		"data":  rows,
		"total": len(rows),
	})
}

// ApproveOlympiadAttempt POST /api/v1/superadmin/approvals/olympiad-attempts/:id/approve
func (h *Handler) ApproveOlympiadAttempt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	res := h.db.Model(&models.OlympiadAttempt{}).
		Where("id = ? AND status = ?", id, "pending_review").
		Update("status", "completed")
	if res.RowsAffected == 0 {
		response.NotFound(c, "Pending attempt topilmadi")
		return
	}
	response.Success(c, http.StatusOK, "Tasdiqlandi", gin.H{"id": id, "status": "completed"})
}
