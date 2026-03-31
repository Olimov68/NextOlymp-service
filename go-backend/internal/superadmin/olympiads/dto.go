package saolympiads

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type CreateRequest struct {
	Title         string   `json:"title" binding:"required,min=3,max=300"`
	Description   string   `json:"description"`
	Subject       string   `json:"subject" binding:"required,min=1,max=100"`
	Grade         int      `json:"grade"`
	Language      string   `json:"language"`
	StartTime     *string  `json:"start_time"`
	EndTime       *string  `json:"end_time"`
	DurationMins  int      `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions int     `json:"total_questions"`
	Rules         string   `json:"rules"`
	Status        string   `json:"status"`
	IsPaid        bool     `json:"is_paid"`
	Price         *float64 `json:"price"`

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

	// Scoring
	MinScoreForCertificate int    `json:"min_score_for_certificate"`
	ScoringRules           string `json:"scoring_rules"`
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

	// Scoring
	MinScoreForCertificate *int    `json:"min_score_for_certificate"`
	ScoringRules           *string `json:"scoring_rules"`

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
	Search   string `form:"search"`
	Grade    *int   `form:"grade"`
	Language string `form:"language"`
	IsPaid   *bool  `form:"is_paid"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type OlympiadResponse struct {
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

	// Scoring
	MinScoreForCertificate int    `json:"min_score_for_certificate"`
	ScoringRules           string `json:"scoring_rules"`

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

// RegistrationResponse — single registration item for list endpoints
type RegistrationResponse struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Status    string `json:"status"`
	JoinedAt  string `json:"joined_at"`
}

// ResultResponse — single result item for results endpoint
type ResultResponse struct {
	ID         uint    `json:"id"`
	UserID     uint    `json:"user_id"`
	Username   string  `json:"username"`
	FirstName  string  `json:"first_name"`
	LastName   string  `json:"last_name"`
	Score      float64 `json:"score"`
	MaxScore   float64 `json:"max_score"`
	Percentage float64 `json:"percentage"`
	Correct    int     `json:"correct"`
	Wrong      int     `json:"wrong"`
	Rank       int     `json:"rank"`
	TimeTaken  int     `json:"time_taken"`
	Status     string  `json:"status"`
}

func ToRegistrationResponse(r *models.OlympiadRegistration) RegistrationResponse {
	resp := RegistrationResponse{
		ID:       r.ID,
		UserID:   r.UserID,
		Status:   string(r.Status),
		JoinedAt: r.JoinedAt.Format(time.RFC3339),
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

func ToResultResponse(a *models.OlympiadAttempt) ResultResponse {
	resp := ResultResponse{
		ID:         a.ID,
		UserID:     a.UserID,
		Score:      a.Score,
		MaxScore:   a.MaxScore,
		Percentage: a.Percentage,
		Correct:    a.Correct,
		Wrong:      a.Wrong,
		Rank:       a.Rank,
		TimeTaken:  a.TimeTaken,
		Status:     a.Status,
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

func ToResponse(o *models.Olympiad) OlympiadResponse {
	return OlympiadResponse{
		ID:             o.ID,
		Title:          o.Title,
		Slug:           o.Slug,
		Description:    o.Description,
		Subject:        o.Subject,
		Grade:          o.Grade,
		Language:       o.Language,
		StartTime:      o.StartTime,
		EndTime:        o.EndTime,
		DurationMins:   o.DurationMins,
		TotalQuestions: o.TotalQuestions,
		Rules:          o.Rules,
		Status:         string(o.Status),
		IsPaid:         o.IsPaid,
		Price:          o.Price,
		CreatedByID:    o.CreatedByID,

		BannerURL: o.BannerURL,
		IconURL:   o.IconURL,

		RegistrationStartTime: o.RegistrationStartTime,
		RegistrationEndTime:   o.RegistrationEndTime,
		MaxSeats:              o.MaxSeats,

		ShuffleQuestions:      o.ShuffleQuestions,
		ShuffleAnswers:        o.ShuffleAnswers,
		AutoSubmit:            o.AutoSubmit,
		AllowRetake:           o.AllowRetake,
		ShowResultImmediately: o.ShowResultImmediately,
		GiveCertificate:       o.GiveCertificate,
		ManualReview:          o.ManualReview,
		AdminApproval:         o.AdminApproval,

		MinScoreForCertificate: o.MinScoreForCertificate,
		ScoringRules:           o.ScoringRules,

		AntiCheatEnabled:       o.AntiCheatEnabled,
		FullscreenRequired:     o.FullscreenRequired,
		TabSwitchDetection:     o.TabSwitchDetection,
		CopyPastePrevention:    o.CopyPastePrevention,
		RightClickBlocked:      o.RightClickBlocked,
		ScreenshotBlocked:      o.ScreenshotBlocked,
		DevtoolsBlocked:        o.DevtoolsBlocked,
		MaxFullscreenViolations: o.MaxFullscreenViolations,
		MaxTabSwitchViolations:  o.MaxTabSwitchViolations,
		MaxCopyPasteViolations:  o.MaxCopyPasteViolations,

		CreatedAt: o.CreatedAt,
		UpdatedAt: o.UpdatedAt,
	}
}
