package models

import (
	"time"

	"gorm.io/gorm"
)

// ChatMessage — chat xabari
type ChatMessage struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       *uint          `gorm:"index" json:"user_id"`
	StaffUserID  *uint          `gorm:"index" json:"staff_user_id,omitempty"`
	RoomID       uint           `gorm:"index;default:1" json:"room_id"`
	ReplyToID    *uint          `gorm:"index" json:"reply_to_id,omitempty"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content      string         `gorm:"type:text;not null" json:"content"`
	Type         string         `gorm:"type:varchar(20);default:'text'" json:"type"` // text, system, admin
	IsDeleted    bool           `gorm:"default:false" json:"is_deleted"`
	DeletedBy    *uint          `json:"deleted_by,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
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

// ChatRoom — chat xonasi
type ChatRoom struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Type      string    `gorm:"type:varchar(20);default:'global'" json:"type"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ChatRoom) TableName() string {
	return "chat_rooms"
}

// ChatModerationLog — moderation logi
type ChatModerationLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StaffID   uint      `gorm:"index;not null" json:"staff_id"`
	Action    string    `gorm:"type:varchar(30);not null" json:"action"`
	TargetID  uint      `json:"target_id"`
	Reason    string    `gorm:"type:text" json:"reason"`
	Details   string    `gorm:"type:text" json:"details"`
	CreatedAt time.Time `json:"created_at"`
}

func (ChatModerationLog) TableName() string {
	return "chat_moderation_logs"
}
