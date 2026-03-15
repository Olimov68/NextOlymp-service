package safeedback

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{repo: NewRepository(db)}
}

// List GET /api/v1/superadmin/feedback
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.repo.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]FeedbackResponse, len(list))
	for i, f := range list {
		items[i] = ToResponse(&f)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Feedbacks", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/feedback/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	f, err := h.repo.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Feedback not found")
			return
		}
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Feedback", ToResponse(f))
}

// Reply PUT /api/v1/superadmin/feedback/:id/reply
func (h *Handler) Reply(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.repo.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Feedback not found")
			return
		}
		response.InternalError(c)
		return
	}

	var req ReplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	now := time.Now()

	// Status — frontenddan kelgan qiymatni ishlatish, default: answered
	status := string(models.FeedbackStatusAnswered)
	if req.Status != "" {
		status = req.Status
	}

	fields := map[string]interface{}{
		"admin_reply": req.Reply,
		"replied_at":  now,
		"status":      status,
	}

	// staffID ni set qilish (agar mavjud bo'lsa)
	if staffID, exists := c.Get("staffID"); exists {
		if sid, ok := staffID.(uint); ok {
			fields["replied_by_id"] = sid
		}
	}

	if err := h.repo.Update(uint(id), fields); err != nil {
		response.InternalError(c)
		return
	}

	updated, _ := h.repo.GetByID(uint(id))
	response.Success(c, http.StatusOK, "Reply sent", ToResponse(updated))
}
