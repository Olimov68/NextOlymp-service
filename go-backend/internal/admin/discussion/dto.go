package admindiscussion

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListMessagesParams struct {
	Search   string `form:"search"`
	Status   string `form:"status"` // active | hidden | deleted
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=50"`
}

type ListUsersParams struct {
	Search   string `form:"search"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type MuteRequest struct {
	Reason string `json:"reason"`
	Hours  int    `json:"hours"` // 0 = doimiy
}

type BlockRequest struct {
	Reason string `json:"reason"`
}

type AdminMessageResponse struct {
	ID          uint       `json:"id"`
	UserID      uint       `json:"user_id"`
	Username    string     `json:"username"`
	DisplayName string     `json:"display_name"`
	Message     string     `json:"message"`
	ReplyToID   *uint      `json:"reply_to_id,omitempty"`
	Status      string     `json:"status"`
	IsEdited    bool       `json:"is_edited"`
	EditedAt    *time.Time `json:"edited_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type AdminUserStateResponse struct {
	ID         uint       `json:"id"`
	UserID     uint       `json:"user_id"`
	Username   string     `json:"username"`
	FullName   string     `json:"full_name"`
	IsMuted    bool       `json:"is_muted"`
	MutedUntil *time.Time `json:"muted_until,omitempty"`
	IsBlocked  bool       `json:"is_blocked"`
	Reason     string     `json:"reason,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func toAdminMessageResponse(m *models.DiscussionMessage) AdminMessageResponse {
	resp := AdminMessageResponse{
		ID:        m.ID,
		UserID:    m.UserID,
		Message:   m.Message,
		ReplyToID: m.ReplyToID,
		Status:    string(m.Status),
		IsEdited:  m.IsEdited,
		EditedAt:  m.EditedAt,
		CreatedAt: m.CreatedAt,
	}
	if m.User != nil {
		resp.Username = m.User.Username
		if m.User.Profile != nil && m.User.Profile.FirstName != "" {
			resp.DisplayName = m.User.Profile.FirstName
			if m.User.Profile.LastName != "" {
				resp.DisplayName += " " + m.User.Profile.LastName
			}
		} else {
			resp.DisplayName = m.User.Username
		}
	}
	return resp
}

func toAdminUserStateResponse(s *models.DiscussionUserState) AdminUserStateResponse {
	resp := AdminUserStateResponse{
		ID:         s.ID,
		UserID:     s.UserID,
		IsMuted:    s.IsMuted,
		MutedUntil: s.MutedUntil,
		IsBlocked:  s.IsBlocked,
		Reason:     s.Reason,
		CreatedAt:  s.CreatedAt,
		UpdatedAt:  s.UpdatedAt,
	}
	if s.User != nil {
		resp.Username = s.User.Username
		if s.User.Profile != nil {
			resp.FullName = s.User.Profile.FirstName + " " + s.User.Profile.LastName
		}
	}
	return resp
}
