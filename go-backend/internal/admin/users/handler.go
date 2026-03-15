package adminusers

import (
	"net/http"
	"strconv"

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

// List — foydalanuvchilar ro'yxati
// GET /api/v1/admin/users
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

	items := make([]gin.H, len(list))
	for i, u := range list {
		fullName := ""
		region := ""
		var grade int
		if u.Profile != nil {
			fullName = u.Profile.FirstName + " " + u.Profile.LastName
			region = u.Profile.Region
			grade = u.Profile.Grade
		}
		items[i] = gin.H{
			"id":                   u.ID,
			"username":             u.Username,
			"full_name":            fullName,
			"region":               region,
			"grade":                grade,
			"status":               u.Status,
			"is_profile_completed": u.IsProfileCompleted,
			"is_telegram_linked":   u.IsTelegramLinked,
			"created_at":           u.CreatedAt,
		}
	}

	response.Success(c, http.StatusOK, "Users", gin.H{
		"data": items, "total": total,
		"page": params.Page, "page_size": params.PageSize,
	})
}

// GetByID — bitta user
// GET /api/v1/admin/users/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	u, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, http.StatusOK, "User", u)
}

// Block — userni bloklash
// PATCH /api/v1/admin/users/:id/block
func (h *Handler) Block(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	if err := h.repo.UpdateStatus(uint(id), models.UserStatusBlocked); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "User blocked", nil)
}

// Unblock — userni blokdan chiqarish
// PATCH /api/v1/admin/users/:id/unblock
func (h *Handler) Unblock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	if err := h.repo.UpdateStatus(uint(id), models.UserStatusActive); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "User unblocked", nil)
}
