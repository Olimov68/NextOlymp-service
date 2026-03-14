package models

import "time"

type MockTestStatus string
type MockTestRegistrationStatus string

const (
	MockTestStatusDraft     MockTestStatus = "draft"
	MockTestStatusPublished MockTestStatus = "published"
	MockTestStatusActive    MockTestStatus = "active"
	MockTestStatusEnded     MockTestStatus = "ended"
	MockTestStatusArchived  MockTestStatus = "archived"
)

const (
	MockTestRegStatusRegistered MockTestRegistrationStatus = "registered"
	MockTestRegStatusCompleted  MockTestRegistrationStatus = "completed"
	MockTestRegStatusCancelled  MockTestRegistrationStatus = "cancelled"
)

type MockTest struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	Title              string         `gorm:"size:300;not null" json:"title"`
	Slug               string         `gorm:"uniqueIndex;size:300;not null" json:"slug"`
	Description        string         `gorm:"type:text" json:"description"`
	Subject            string         `gorm:"size:100" json:"subject"`
	Grade              int            `gorm:"default:0" json:"grade"`
	Language           string         `gorm:"size:20;default:uz" json:"language"`
	DurationMins       int            `gorm:"default:60" json:"duration_minutes"`
	TotalQuestions     int            `gorm:"default:0" json:"total_questions"`
	ScoringType        string         `gorm:"size:50;default:simple" json:"scoring_type"`              // simple | rasch
	ScalingFormulaType string         `gorm:"size:50;default:none" json:"scaling_formula_type"`         // none | prop_93_65 | prop_63_65
	Status             MockTestStatus `gorm:"size:20;default:draft;not null" json:"status"`
	IsPaid             bool           `gorm:"default:false;not null" json:"is_paid"`
	Price              *float64       `json:"price,omitempty"`
	CreatedByID        *uint          `gorm:"index" json:"created_by_id,omitempty"`
	CreatedAt          time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
}

type MockTestRegistration struct {
	ID         uint                       `gorm:"primaryKey" json:"id"`
	UserID     uint                       `gorm:"not null;index" json:"user_id"`
	MockTestID uint                       `gorm:"not null;index" json:"mock_test_id"`
	Status     MockTestRegistrationStatus `gorm:"size:20;default:registered;not null" json:"status"`
	JoinedAt   time.Time                  `gorm:"autoCreateTime" json:"joined_at"`
	UpdatedAt  time.Time                  `gorm:"autoUpdateTime" json:"updated_at"`

	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MockTest *MockTest `gorm:"foreignKey:MockTestID" json:"mock_test,omitempty"`
}
