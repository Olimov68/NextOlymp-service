package superadminaudit

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

// List GET /api/v1/superadmin/audit-logs
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 200 {
		pageSize = 50
	}

	actorType := c.Query("actor_type")
	action := c.Query("action")
	resource := c.Query("resource")

	var list []models.AuditLog
	var total int64
	q := h.db.Model(&models.AuditLog{})
	if actorType != "" {
		q = q.Where("actor_type = ?", actorType)
	}
	if action != "" {
		q = q.Where("action ILIKE ?", "%"+action+"%")
	}
	if resource != "" {
		q = q.Where("resource = ?", resource)
	}

	q.Count(&total)
	q.Order("created_at DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).Find(&list)

	response.SuccessWithPagination(c, http.StatusOK, "Audit logs", list, page, pageSize, total)
}
