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
	StartTime          *time.Time     `json:"start_time,omitempty"`
	EndTime            *time.Time     `json:"end_time,omitempty"`
	DurationMins       int            `gorm:"default:60" json:"duration_minutes"`
	TotalQuestions     int            `gorm:"default:0" json:"total_questions"`
	Rules              string         `gorm:"type:text" json:"rules"`
	ScoringType        string         `gorm:"size:50;default:simple" json:"scoring_type"`      // simple | rasch
	ScalingFormulaType string         `gorm:"size:50;default:none" json:"scaling_formula_type"` // none | prop_93_65 | prop_63_65
	Status             MockTestStatus `gorm:"size:20;default:draft;not null" json:"status"`
	IsPaid             bool           `gorm:"default:false;not null" json:"is_paid"`
	Price              *float64       `json:"price,omitempty"`
	CreatedByID        *uint          `gorm:"index" json:"created_by_id,omitempty"`

	// Media
	BannerURL string `gorm:"size:500" json:"banner_url"`
	IconURL   string `gorm:"size:500" json:"icon_url"`

	// Ro'yxatdan o'tish oralig'i
	RegistrationStartTime *time.Time `json:"registration_start_time,omitempty"`
	RegistrationEndTime   *time.Time `json:"registration_end_time,omitempty"`
	MaxSeats              int        `gorm:"default:0" json:"max_seats"` // 0 = cheksiz

	// Sozlamalar
	ShuffleQuestions       bool `gorm:"default:false" json:"shuffle_questions"`
	ShuffleAnswers         bool `gorm:"default:false" json:"shuffle_answers"`
	AutoSubmit             bool `gorm:"default:true" json:"auto_submit"`
	AllowRetake            bool `gorm:"default:false" json:"allow_retake"`
	ShowResultImmediately  bool `gorm:"default:true" json:"show_result_immediately"`
	GiveCertificate        bool `gorm:"default:false" json:"give_certificate"`
	ManualReview           bool `gorm:"default:false" json:"manual_review"`
	AdminApproval          bool `gorm:"default:false" json:"admin_approval"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
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

func (MockTest) TableName() string { return "mock_test" }
func (MockTestRegistration) TableName() string { return "mock_test_registration" }
