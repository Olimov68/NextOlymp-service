package models

import (
	"time"

	"gorm.io/datatypes"
)

// AntiCheatViolation — anti-cheat qoidabuzarlik yozuvi
type AntiCheatViolation struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"index;not null" json:"user_id"`
	AttemptID   uint           `gorm:"index;not null" json:"attempt_id"`
	AttemptType string         `gorm:"type:varchar(20);not null" json:"attempt_type"` // olympiad, mock_test
	Type        string         `gorm:"type:varchar(50);not null" json:"type"`         // tab_switch, blur, copy_paste, devtools, right_click, fullscreen_exit, offline, screenshot, screen_record, face_not_found, face_mismatch, multiple_faces, voice_detected
	Severity    string         `gorm:"type:varchar(20);default:'warning'" json:"severity"` // info, warning, critical
	DeviceType  string         `gorm:"type:varchar(20);default:'web'" json:"device_type"`  // web, windows, android
	Metadata    datatypes.JSON `gorm:"type:jsonb" json:"metadata,omitempty"`
	IPAddress   string         `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent   string         `gorm:"type:text" json:"user_agent"`
	CreatedAt   time.Time      `json:"created_at"`
}

func (AntiCheatViolation) TableName() string {
	return "anti_cheat_violations"
}

// SuspiciousEvent — umumiy shubhali hodisa
type SuspiciousEvent struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     *uint          `gorm:"index" json:"user_id,omitempty"`
	EventType  string         `gorm:"type:varchar(50);not null;index" json:"event_type"` // brute_force, suspicious_login, multiple_ip, rapid_answers
	Details    string         `gorm:"type:text" json:"details"`
	Metadata   datatypes.JSON `gorm:"type:jsonb" json:"metadata,omitempty"`
	IPAddress  string         `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent  string         `gorm:"type:text" json:"user_agent"`
	IsResolved bool           `gorm:"default:false" json:"is_resolved"`
	ResolvedBy *uint          `json:"resolved_by,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
}

func (SuspiciousEvent) TableName() string {
	return "suspicious_events"
}
