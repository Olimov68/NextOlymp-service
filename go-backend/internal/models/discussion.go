package models

import "time"

type DiscussionMessageStatus string

const (
	DiscussionMessageActive  DiscussionMessageStatus = "active"
	DiscussionMessageDeleted DiscussionMessageStatus = "deleted"
	DiscussionMessageHidden  DiscussionMessageStatus = "hidden"
)

// DiscussionMessage — umumiy muhokama xabarlari
type DiscussionMessage struct {
	ID        uint                    `gorm:"primaryKey" json:"id"`
	UserID    uint                    `gorm:"not null;index" json:"user_id"`
	Message   string                  `gorm:"type:text;not null" json:"message"`
	ReplyToID *uint                   `gorm:"index" json:"reply_to_id,omitempty"`
	Status    DiscussionMessageStatus `gorm:"size:20;default:active;not null" json:"status"`
	IsEdited  bool                    `gorm:"default:false;not null" json:"is_edited"`
	EditedAt  *time.Time              `json:"edited_at,omitempty"`
	CreatedAt time.Time               `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time               `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	User    *User              `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ReplyTo *DiscussionMessage `gorm:"foreignKey:ReplyToID" json:"reply_to,omitempty"`
}

func (DiscussionMessage) TableName() string { return "discussion_message" }

// DiscussionUserState — foydalanuvchining muhokamadagi holati (mute/block)
type DiscussionUserState struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	UserID     uint       `gorm:"uniqueIndex;not null" json:"user_id"`
	IsMuted    bool       `gorm:"default:false;not null" json:"is_muted"`
	MutedUntil *time.Time `json:"muted_until,omitempty"`
	IsBlocked  bool       `gorm:"default:false;not null" json:"is_blocked"`
	Reason     string     `gorm:"size:500" json:"reason,omitempty"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (DiscussionUserState) TableName() string { return "discussion_user_state" }
