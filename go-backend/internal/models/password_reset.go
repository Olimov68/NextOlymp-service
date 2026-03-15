package models

import (
	"time"
)

// PasswordResetCode — parolni tiklash uchun Telegram orqali yuborilgan kod
type PasswordResetCode struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Code      string    `gorm:"size:10;not null" json:"code"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false;not null" json:"used"`
	Verified  bool      `gorm:"default:false;not null" json:"verified"` // kod tasdiqlandi, parol o'zgartirishga ruxsat
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
