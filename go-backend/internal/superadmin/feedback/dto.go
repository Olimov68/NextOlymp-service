package safeedback

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ReplyRequest struct {
	Reply  string `json:"reply" binding:"required,min=1"`
	Status string `json:"status"`
}

type ListParams struct {
	Status   string `form:"status"`
	Category string `form:"category"`
	Search   string `form:"search"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type FeedbackResponse struct {
	ID          uint       `json:"id"`
	UserID      uint       `json:"user_id"`
	Username    string     `json:"username,omitempty"`
	Category    string     `json:"category"`
	Subject     string     `json:"subject"`
	Message     string     `json:"message"`
	Status      string     `json:"status"`
	AdminReply  *string    `json:"admin_reply,omitempty"`
	RepliedByID *uint      `json:"replied_by_id,omitempty"`
	RepliedAt   *time.Time `json:"replied_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func ToResponse(f *models.Feedback) FeedbackResponse {
	resp := FeedbackResponse{
		ID:          f.ID,
		UserID:      f.UserID,
		Category:    f.Category,
		Subject:     f.Subject,
		Message:     f.Message,
		Status:      string(f.Status),
		AdminReply:  f.AdminReply,
		RepliedByID: f.RepliedByID,
		RepliedAt:   f.RepliedAt,
		CreatedAt:   f.CreatedAt,
		UpdatedAt:   f.UpdatedAt,
	}
	if f.User != nil {
		resp.Username = f.User.Username
	}
	return resp
}
