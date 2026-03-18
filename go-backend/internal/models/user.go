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

type VerificationStatus string

const (
	VerificationPending          VerificationStatus = "pending"
	VerificationTelegramVerified VerificationStatus = "telegram_verified"
	VerificationAdminVerified    VerificationStatus = "admin_verified"
	VerificationRejected         VerificationStatus = "rejected"
)

type User struct {
	ID                 uint       `gorm:"primaryKey" json:"id"`
	Username           string     `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash       string     `gorm:"size:255;not null" json:"-"`
	Status             UserStatus `gorm:"size:20;default:active;not null" json:"status"`
	IsProfileCompleted bool       `gorm:"default:false;not null" json:"is_profile_completed"`
	IsTelegramLinked   bool       `gorm:"default:false;not null" json:"is_telegram_linked"`

	// Verification
	VerificationStatus  VerificationStatus `gorm:"size:30;default:pending;not null" json:"verification_status"`
	VerifiedAt          *time.Time         `json:"verified_at,omitempty"`
	VerifiedByStaffID   *uint              `json:"verified_by_staff_id,omitempty"`
	VerificationNote    string             `gorm:"size:500" json:"verification_note,omitempty"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	Profile      *Profile      `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	TelegramLink *TelegramLink `gorm:"foreignKey:UserID" json:"telegram_link,omitempty"`
}

func (User) TableName() string { return "user" }

// IsVerified — user tasdiqlangan bo'lsa true qaytaradi
// Telegram verified YOKI admin verified — ikkalasi ham valid
func (u *User) IsVerified() bool {
	return u.VerificationStatus == VerificationTelegramVerified ||
		u.VerificationStatus == VerificationAdminVerified
}

// HasFullAccess — user to'liq tizimdan foydalana olishini tekshiradi
func (u *User) HasFullAccess() bool {
	return u.Status == UserStatusActive &&
		u.IsProfileCompleted &&
		u.IsVerified()
}
