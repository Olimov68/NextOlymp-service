package models

import "time"

type OlympiadStatus string

const (
	OlympiadStatusDraft     OlympiadStatus = "draft"
	OlympiadStatusPublished OlympiadStatus = "published"
	OlympiadStatusActive    OlympiadStatus = "active"
	OlympiadStatusEnded     OlympiadStatus = "ended"
	OlympiadStatusArchived  OlympiadStatus = "archived"
)

type OlympiadRegistrationStatus string

const (
	OlympiadRegStatusRegistered  OlympiadRegistrationStatus = "registered"
	OlympiadRegStatusParticipant OlympiadRegistrationStatus = "participant"
	OlympiadRegStatusCompleted   OlympiadRegistrationStatus = "completed"
	OlympiadRegStatusCancelled   OlympiadRegistrationStatus = "cancelled"
)

type Olympiad struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Title          string         `gorm:"size:300;not null" json:"title"`
	Slug           string         `gorm:"uniqueIndex;size:300;not null" json:"slug"`
	Description    string         `gorm:"type:text" json:"description"`
	Subject        string         `gorm:"size:100" json:"subject"`
	Grade          int            `gorm:"default:0" json:"grade"`
	Language       string         `gorm:"size:20;default:uz" json:"language"`
	StartTime      *time.Time     `json:"start_time,omitempty"`
	EndTime        *time.Time     `json:"end_time,omitempty"`
	DurationMins   int            `gorm:"default:60" json:"duration_minutes"`
	TotalQuestions int            `gorm:"default:0" json:"total_questions"`
	Rules          string         `gorm:"type:text" json:"rules"`
	Status         OlympiadStatus `gorm:"size:20;default:draft;not null" json:"status"`
	IsPaid         bool           `gorm:"default:false;not null" json:"is_paid"`
	Price          *float64       `json:"price,omitempty"`
	CreatedByID    *uint          `gorm:"index" json:"created_by_id,omitempty"`

	// Media
	BannerURL string `gorm:"size:500" json:"banner_url"`
	IconURL   string `gorm:"size:500" json:"icon_url"`

	// Ro'yxatdan o'tish oralig'i
	RegistrationStartTime *time.Time `json:"registration_start_time,omitempty"`
	RegistrationEndTime   *time.Time `json:"registration_end_time,omitempty"`
	MaxSeats              int        `gorm:"default:0" json:"max_seats"` // 0 = cheksiz

	// Ro'yxatdan o'tish holati (admin boshqaradi)
	RegistrationOpen bool `gorm:"default:true" json:"registration_open"`

	// Sozlamalar
	ShuffleQuestions       bool `gorm:"default:false" json:"shuffle_questions"`
	ShuffleAnswers         bool `gorm:"default:false" json:"shuffle_answers"`
	AutoSubmit             bool `gorm:"default:true" json:"auto_submit"`
	AllowRetake            bool `gorm:"default:false" json:"allow_retake"`
	ShowResultImmediately  bool `gorm:"default:true" json:"show_result_immediately"`
	GiveCertificate        bool `gorm:"default:false" json:"give_certificate"`
	ManualReview           bool `gorm:"default:false" json:"manual_review"`
	AdminApproval          bool `gorm:"default:false" json:"admin_approval"`

	// Ball tizimi — admin belgilaydi
	MinScoreForCertificate int    `gorm:"default:0" json:"min_score_for_certificate"`   // sertifikat uchun minimal ball
	ScoringRules           string `gorm:"type:text" json:"scoring_rules"`                // JSON: {"30":10,"28":8,...} to'g'ri javob soni→ball

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type OlympiadRegistration struct {
	ID          uint                       `gorm:"primaryKey" json:"id"`
	UserID      uint                       `gorm:"not null;index" json:"user_id"`
	OlympiadID  uint                       `gorm:"not null;index" json:"olympiad_id"`
	Status      OlympiadRegistrationStatus `gorm:"size:20;default:registered;not null" json:"status"`
	JoinedAt    time.Time                  `gorm:"autoCreateTime" json:"joined_at"`
	UpdatedAt   time.Time                  `gorm:"autoUpdateTime" json:"updated_at"`

	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Olympiad *Olympiad `gorm:"foreignKey:OlympiadID" json:"olympiad,omitempty"`
}

func (Olympiad) TableName() string { return "olympiad" }
func (OlympiadRegistration) TableName() string { return "olympiad_registration" }
