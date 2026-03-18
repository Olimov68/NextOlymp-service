package models

import (
	"time"

	"gorm.io/gorm"
)

// ChatMessage — chat xabari
type ChatMessage struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Type      string         `gorm:"type:varchar(20);default:'text'" json:"type"` // text, system, admin
	IsDeleted bool           `gorm:"default:false" json:"is_deleted"`
	DeletedBy *uint          `json:"deleted_by,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ChatMessage) TableName() string {
	return "chat_messages"
}

// ChatBan — chat ban
type ChatBan struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"index;not null" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BannedBy  uint       `gorm:"not null" json:"banned_by"`
	Reason    string     `gorm:"type:text" json:"reason"`
	Type      string     `gorm:"type:varchar(20);default:'permanent'" json:"type"` // mute, ban, permanent
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	IsActive  bool       `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (ChatBan) TableName() string {
	return "chat_bans"
}

// ChatSetting — chat sozlamalari
type ChatSetting struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	IsChatOpen     bool      `gorm:"default:true" json:"is_chat_open"`
	SlowMode       int       `gorm:"default:0" json:"slow_mode"` // sekundlarda, 0 = o'chirilgan
	MinAccountAge  int       `gorm:"default:0" json:"min_account_age"` // kunlarda
	MaxMessageLen  int       `gorm:"default:500" json:"max_message_len"`
	PinnedMessage  string    `gorm:"type:text" json:"pinned_message"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (ChatSetting) TableName() string {
	return "chat_settings"
}
