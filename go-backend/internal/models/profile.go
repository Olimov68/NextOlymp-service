package models

import (
	"time"
)

type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
)

type Profile struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	FirstName  string    `gorm:"size:100;not null" json:"first_name"`
	LastName   string    `gorm:"size:100;not null" json:"last_name"`
	BirthDate  string    `gorm:"size:10;not null" json:"birth_date"` // YYYY-MM-DD
	Gender     Gender    `gorm:"size:10;not null" json:"gender"`
	Region     string    `gorm:"size:100;not null" json:"region"`
	District   string    `gorm:"size:100;not null" json:"district"`
	SchoolName string    `gorm:"size:200;not null" json:"school_name"`
	Grade      int       `gorm:"not null" json:"grade"`
	PhotoURL       string    `gorm:"size:500" json:"photo_url"`
	FaceEmbedding  string    `gorm:"type:text" json:"-"` // JSON array of floats, hidden from API

	// XP / Level / Streak — har test uchun beriladigan ball tizimi
	TotalXP        int64      `gorm:"default:0;index:idx_profile_total_xp" json:"total_xp"`
	Level          int        `gorm:"default:1" json:"level"`
	TestsCompleted int        `gorm:"default:0" json:"tests_completed"`
	CurrentStreak  int        `gorm:"default:0" json:"current_streak"`
	BestStreak     int        `gorm:"default:0" json:"best_streak"`
	LastTestDate   *time.Time `gorm:"type:date" json:"last_test_date,omitempty"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Profile) TableName() string { return "profile" }
