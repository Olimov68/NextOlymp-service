package models

import (
	"time"
)

type UserStatus string

const (
	UserStatusActive  UserStatus = "active"
	UserStatusBlocked UserStatus = "blocked"
	UserStatusDeleted UserStatus = "deleted"
)

type User struct {
	ID                 uint       `gorm:"primaryKey" json:"id"`
	Username           string     `gorm:"uniqueIndex;size:50" json:"username"`
	PasswordHash       string     `gorm:"size:255" json:"-"`
	GoogleID           *string    `gorm:"uniqueIndex;size:255" json:"google_id,omitempty"`
	Email              *string    `gorm:"uniqueIndex;size:255" json:"email,omitempty"`
	FullName           string     `gorm:"size:200" json:"full_name,omitempty"`
	AvatarURL          string     `gorm:"size:500" json:"avatar_url,omitempty"`
	Status             UserStatus `gorm:"size:20;default:active;not null" json:"status"`
	IsProfileCompleted bool       `gorm:"default:false;not null" json:"is_profile_completed"`
	IsTelegramLinked   bool       `gorm:"default:false;not null" json:"is_telegram_linked"`
	IsVerified         bool       `gorm:"default:true;not null" json:"is_verified"`
	VerificationMethod string     `gorm:"type:varchar(30)" json:"verification_method"`
	VerifiedAt         *time.Time `json:"verified_at,omitempty"`
	VerifiedBy         *uint      `json:"verified_by,omitempty"`
	CreatedAt          time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	Profile      *Profile      `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	TelegramLink *TelegramLink `gorm:"foreignKey:UserID" json:"telegram_link,omitempty"`
}

func (User) TableName() string { return "user" }

// UserVerification — foydalanuvchi tasdiqlash yozuvi
type UserVerification struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	UserID     uint       `gorm:"index;not null" json:"user_id"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Method     string     `gorm:"type:varchar(30);not null" json:"method"`
	Status     string     `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Note       string     `gorm:"type:text" json:"note"`
	Reason     string     `gorm:"type:text" json:"reason"`
	ApprovedBy *uint      `json:"approved_by,omitempty"`
	VerifiedAt *time.Time `json:"verified_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (UserVerification) TableName() string { return "user_verifications" }
