package adminfeedback

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

// List GET /api/v1/admin/feedback
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	var list []models.Feedback
	var total int64
	q := h.db.Model(&models.Feedback{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	q.Preload("User").Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list)

	response.Success(c, http.StatusOK, "Feedbacks", gin.H{
		"data": list, "total": total,
		"page": params.Page, "page_size": params.PageSize,
	})
}

// GetByID GET /api/v1/admin/feedback/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	var f models.Feedback
	if err := h.db.Preload("User").First(&f, id).Error; err != nil {
		response.NotFound(c, "Feedback not found")
		return
	}
	response.Success(c, http.StatusOK, "Feedback", f)
}

// Reply PUT /api/v1/admin/feedback/:id/reply
func (h *Handler) Reply(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	var req ReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	now := time.Now()

	status := string(models.FeedbackStatusAnswered)
	if req.Status != "" {
		status = req.Status
	}

	fields := map[string]interface{}{
		"admin_reply": req.Reply,
		"status":      status,
		"replied_at":  now,
	}

	if staffID, exists := c.Get("staffID"); exists {
		if sid, ok := staffID.(uint); ok {
			fields["replied_by_id"] = sid
		}
	}

	if err := h.db.Model(&models.Feedback{}).Where("id = ?", id).Updates(fields).Error; err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Reply sent", nil)
}

// results handler (kelajakda kengaytiriladi)
type ResultsHandler struct {
	db *gorm.DB
}

func NewResultsHandler(db *gorm.DB) *ResultsHandler {
	return &ResultsHandler{db: db}
}

// List GET /api/v1/admin/results
func (h *ResultsHandler) List(c *gin.Context) {
	// TODO: exam results/submissions jadvali qo'shilgandan keyin to'ldiriladi
	response.Success(c, http.StatusOK, "Results", gin.H{
		"data":    []interface{}{},
		"message": "Exam engine integration pending",
	})
}

// GetByID GET /api/v1/admin/results/:id
func (h *ResultsHandler) GetByID(c *gin.Context) {
	response.Success(c, http.StatusOK, "Result", gin.H{
		"message": "Exam engine integration pending",
	})
}
