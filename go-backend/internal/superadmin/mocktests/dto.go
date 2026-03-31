package samocktests

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type CreateRequest struct {
	Title          string   `json:"title" binding:"required,min=3,max=300"`
	Description    string   `json:"description"`
	Subject        string   `json:"subject" binding:"required,min=1,max=100"`
	Grade          int      `json:"grade"`
	Language       string   `json:"language"`
	StartTime      *string  `json:"start_time"`
	EndTime        *string  `json:"end_time"`
	DurationMins   int      `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions int      `json:"total_questions"`
	Rules          string   `json:"rules"`
	ScoringType    string   `json:"scoring_type"`
	Status         string   `json:"status"`
	IsPaid         bool     `json:"is_paid"`
	Price          *float64 `json:"price"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *string `json:"registration_start_time"`
	RegistrationEndTime   *string `json:"registration_end_time"`
	MaxSeats              int     `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`
}

type UpdateRequest struct {
	Title          *string  `json:"title"`
	Description    *string  `json:"description"`
	Subject        *string  `json:"subject"`
	Grade          *int     `json:"grade"`
	Language       *string  `json:"language"`
	StartTime      *string  `json:"start_time"`
	EndTime        *string  `json:"end_time"`
	DurationMins   *int     `json:"duration_minutes"`
	TotalQuestions *int     `json:"total_questions"`
	Rules          *string  `json:"rules"`
	ScoringType    *string  `json:"scoring_type"`
	Status         *string  `json:"status"`
	IsPaid         *bool    `json:"is_paid"`
	Price          *float64 `json:"price"`

	// Media
	BannerURL *string `json:"banner_url"`
	IconURL   *string `json:"icon_url"`

	// Registration
	RegistrationStartTime *string `json:"registration_start_time"`
	RegistrationEndTime   *string `json:"registration_end_time"`
	MaxSeats              *int    `json:"max_seats"`

	// Settings
	ShuffleQuestions      *bool `json:"shuffle_questions"`
	ShuffleAnswers        *bool `json:"shuffle_answers"`
	AutoSubmit            *bool `json:"auto_submit"`
	AllowRetake           *bool `json:"allow_retake"`
	ShowResultImmediately *bool `json:"show_result_immediately"`
	GiveCertificate       *bool `json:"give_certificate"`
	ManualReview          *bool `json:"manual_review"`
	AdminApproval         *bool `json:"admin_approval"`

	// Anti-cheat
	AntiCheatEnabled        *bool `json:"anti_cheat_enabled"`
	FullscreenRequired      *bool `json:"fullscreen_required"`
	TabSwitchDetection      *bool `json:"tab_switch_detection"`
	CopyPastePrevention     *bool `json:"copy_paste_prevention"`
	RightClickBlocked       *bool `json:"right_click_blocked"`
	ScreenshotBlocked       *bool `json:"screenshot_blocked"`
	DevtoolsBlocked         *bool `json:"devtools_blocked"`
	MaxFullscreenViolations *int  `json:"max_fullscreen_violations"`
	MaxTabSwitchViolations  *int  `json:"max_tab_switch_violations"`
	MaxCopyPasteViolations  *int  `json:"max_copy_paste_violations"`
}

type ListParams struct {
	Status   string `form:"status"`
	Subject  string `form:"subject"`
	Grade    int    `form:"grade"`
	Language string `form:"language"`
	IsPaid   *bool  `form:"is_paid"`
	Search   string `form:"search"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type MockTestResponse struct {
	ID             uint       `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Description    string     `json:"description"`
	Subject        string     `json:"subject"`
	Grade          int        `json:"grade"`
	Language       string     `json:"language"`
	StartTime      *time.Time `json:"start_time,omitempty"`
	EndTime        *time.Time `json:"end_time,omitempty"`
	DurationMins   int        `json:"duration_minutes"`
	TotalQuestions int        `json:"total_questions"`
	Rules          string     `json:"rules"`
	ScoringType    string     `json:"scoring_type"`
	Status         string     `json:"status"`
	IsPaid         bool       `json:"is_paid"`
	Price          *float64   `json:"price,omitempty"`
	CreatedByID    *uint      `json:"created_by_id,omitempty"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time,omitempty"`
	RegistrationEndTime   *time.Time `json:"registration_end_time,omitempty"`
	MaxSeats              int        `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`

	// Anti-cheat
	AntiCheatEnabled       bool `json:"anti_cheat_enabled"`
	FullscreenRequired     bool `json:"fullscreen_required"`
	TabSwitchDetection     bool `json:"tab_switch_detection"`
	CopyPastePrevention    bool `json:"copy_paste_prevention"`
	RightClickBlocked      bool `json:"right_click_blocked"`
	ScreenshotBlocked      bool `json:"screenshot_blocked"`
	DevtoolsBlocked        bool `json:"devtools_blocked"`
	MaxFullscreenViolations int  `json:"max_fullscreen_violations"`
	MaxTabSwitchViolations  int  `json:"max_tab_switch_violations"`
	MaxCopyPasteViolations  int  `json:"max_copy_paste_violations"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PaginationParams — common pagination query params
type PaginationParams struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"page_size,default=20"`
}

// RegistrationResponse — registration list item
type RegistrationResponse struct {
	ID         uint      `json:"id"`
	UserID     uint      `json:"user_id"`
	MockTestID uint      `json:"mock_test_id"`
	Status     string    `json:"status"`
	JoinedAt   time.Time `json:"joined_at"`
	Username   string    `json:"username"`
	FirstName  string    `json:"first_name,omitempty"`
	LastName   string    `json:"last_name,omitempty"`
}

func ToRegistrationResponse(r *models.MockTestRegistration) RegistrationResponse {
	resp := RegistrationResponse{
		ID:         r.ID,
		UserID:     r.UserID,
		MockTestID: r.MockTestID,
		Status:     string(r.Status),
		JoinedAt:   r.JoinedAt,
	}
	if r.User != nil {
		resp.Username = r.User.Username
		if r.User.Profile != nil {
			resp.FirstName = r.User.Profile.FirstName
			resp.LastName = r.User.Profile.LastName
		}
	}
	return resp
}

// ResultResponse — attempt/result list item
type ResultResponse struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	Username    string    `json:"username"`
	FirstName   string    `json:"first_name,omitempty"`
	LastName    string    `json:"last_name,omitempty"`
	Score       float64   `json:"score"`
	MaxScore    float64   `json:"max_score"`
	Percentage  float64   `json:"percentage"`
	ThetaScore  *float64  `json:"theta_score,omitempty"`
	ZScore      *float64  `json:"z_score,omitempty"`
	TScore      *float64  `json:"t_score,omitempty"`
	ScaledScore *float64  `json:"scaled_score,omitempty"`
	GradeLabel  string    `json:"grade_label,omitempty"`
	TimeTaken   int       `json:"time_taken"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func ToResultResponse(a *models.MockAttempt) ResultResponse {
	resp := ResultResponse{
		ID:          a.ID,
		UserID:      a.UserID,
		Score:       a.Score,
		MaxScore:    a.MaxScore,
		Percentage:  a.Percentage,
		ThetaScore:  a.ThetaScore,
		ZScore:      a.ZScore,
		TScore:      a.TScore,
		ScaledScore: a.ScaledScore,
		GradeLabel:  a.GradeLabel,
		TimeTaken:   a.TimeTaken,
		Status:      a.Status,
		CreatedAt:   a.CreatedAt,
	}
	if a.User != nil {
		resp.Username = a.User.Username
		if a.User.Profile != nil {
			resp.FirstName = a.User.Profile.FirstName
			resp.LastName = a.User.Profile.LastName
		}
	}
	return resp
}

func ToResponse(m *models.MockTest) MockTestResponse {
	return MockTestResponse{
		ID:                    m.ID,
		Title:                 m.Title,
		Slug:                  m.Slug,
		Description:           m.Description,
		Subject:               m.Subject,
		Grade:                 m.Grade,
		Language:              m.Language,
		StartTime:             m.StartTime,
		EndTime:               m.EndTime,
		DurationMins:          m.DurationMins,
		TotalQuestions:        m.TotalQuestions,
		Rules:                 m.Rules,
		ScoringType:           m.ScoringType,
		Status:                string(m.Status),
		IsPaid:                m.IsPaid,
		Price:                 m.Price,
		CreatedByID:           m.CreatedByID,
		BannerURL:             m.BannerURL,
		IconURL:               m.IconURL,
		RegistrationStartTime: m.RegistrationStartTime,
		RegistrationEndTime:   m.RegistrationEndTime,
		MaxSeats:              m.MaxSeats,
		ShuffleQuestions:      m.ShuffleQuestions,
		ShuffleAnswers:        m.ShuffleAnswers,
		AutoSubmit:            m.AutoSubmit,
		AllowRetake:           m.AllowRetake,
		ShowResultImmediately: m.ShowResultImmediately,
		GiveCertificate:       m.GiveCertificate,
		ManualReview:          m.ManualReview,
		AdminApproval:         m.AdminApproval,

		AntiCheatEnabled:       m.AntiCheatEnabled,
		FullscreenRequired:     m.FullscreenRequired,
		TabSwitchDetection:     m.TabSwitchDetection,
		CopyPastePrevention:    m.CopyPastePrevention,
		RightClickBlocked:      m.RightClickBlocked,
		ScreenshotBlocked:      m.ScreenshotBlocked,
		DevtoolsBlocked:        m.DevtoolsBlocked,
		MaxFullscreenViolations: m.MaxFullscreenViolations,
		MaxTabSwitchViolations:  m.MaxTabSwitchViolations,
		MaxCopyPasteViolations:  m.MaxCopyPasteViolations,

		CreatedAt:             m.CreatedAt,
		UpdatedAt:             m.UpdatedAt,
	}
}
