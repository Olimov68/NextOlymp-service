package userdiscussion

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListParams struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"page_size,default=50"`
}

type CreateMessageRequest struct {
	Message   string `json:"message" binding:"required,min=1,max=2000"`
	ReplyToID *uint  `json:"reply_to_id,omitempty"`
}

type UpdateMessageRequest struct {
	Message string `json:"message" binding:"required,min=1,max=2000"`
}

type MessageResponse struct {
	ID          uint             `json:"id"`
	UserID      uint             `json:"user_id"`
	Username    string           `json:"username"`
	DisplayName string           `json:"display_name"`
	UserAvatar  string           `json:"user_avatar,omitempty"`
	Message     string           `json:"message"`
	ReplyToID   *uint            `json:"reply_to_id,omitempty"`
	ReplyTo     *ReplyToResponse `json:"reply_to,omitempty"`
	Status      string           `json:"status"`
	IsEdited    bool             `json:"is_edited"`
	CreatedAt   time.Time        `json:"created_at"`
}

type ReplyToResponse struct {
	ID          uint   `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Message     string `json:"message"`
}

type UserStateResponse struct {
	IsMuted    bool       `json:"is_muted"`
	MutedUntil *time.Time `json:"muted_until,omitempty"`
	IsBlocked  bool       `json:"is_blocked"`
}

const deletedPlaceholder = "Bu xabar o'chirilgan"
const hiddenPlaceholder = "Bu xabar yashirilgan"

func toMessageResponse(m *models.DiscussionMessage) MessageResponse {
	resp := MessageResponse{
		ID:        m.ID,
		UserID:    m.UserID,
		Status:    string(m.Status),
		IsEdited:  m.IsEdited,
		CreatedAt: m.CreatedAt,
		ReplyToID: m.ReplyToID,
	}

	// Deleted/hidden xabar uchun placeholder
	if m.Status == models.DiscussionMessageDeleted {
		resp.Message = deletedPlaceholder
		resp.Username = ""
		resp.DisplayName = ""
		return resp
	}
	if m.Status == models.DiscussionMessageHidden {
		resp.Message = hiddenPlaceholder
		resp.Username = ""
		resp.DisplayName = ""
		return resp
	}

	resp.Message = m.Message

	if m.User != nil {
		resp.Username = m.User.Username
		resp.DisplayName = makeDisplayName(m.User)
		if m.User.Profile != nil && m.User.Profile.PhotoURL != "" {
			resp.UserAvatar = m.User.Profile.PhotoURL
		}
	}

	// Reply info
	if m.ReplyTo != nil && m.ReplyTo.Status == models.DiscussionMessageActive {
		reply := &ReplyToResponse{
			ID:      m.ReplyTo.ID,
			Message: m.ReplyTo.Message,
		}
		if m.ReplyTo.User != nil {
			reply.Username = m.ReplyTo.User.Username
			reply.DisplayName = makeDisplayName(m.ReplyTo.User)
		}
		resp.ReplyTo = reply
	} else if m.ReplyTo != nil {
		resp.ReplyTo = &ReplyToResponse{
			ID:      m.ReplyTo.ID,
			Message: deletedPlaceholder,
		}
	}

	return resp
}

func makeDisplayName(u *models.User) string {
	if u.Profile != nil && u.Profile.FirstName != "" {
		name := u.Profile.FirstName
		if u.Profile.LastName != "" {
			name += " " + string([]rune(u.Profile.LastName)[0]) + "."
		}
		return name
	}
	return u.Username
}
