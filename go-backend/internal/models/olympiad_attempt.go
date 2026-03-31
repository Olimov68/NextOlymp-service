package models

import "time"

// OlympiadAttempt — foydalanuvchining olimpiada topshirish urinishi
type OlympiadAttempt struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	UserID     uint       `gorm:"not null;index" json:"user_id"`
	OlympiadID uint       `gorm:"not null;index" json:"olympiad_id"`
	StartedAt  time.Time  `gorm:"not null" json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	Score      float64    `gorm:"default:0" json:"score"`
	MaxScore   float64    `gorm:"default:0" json:"max_score"`
	Correct    int        `gorm:"default:0" json:"correct"`
	Wrong      int        `gorm:"default:0" json:"wrong"`
	Unanswered int        `gorm:"default:0" json:"unanswered"`
	Percentage float64    `gorm:"default:0" json:"percentage"`
	Rank       int        `gorm:"default:0" json:"rank"`
	TimeTaken  int        `gorm:"default:0" json:"time_taken"`
	Status         string     `gorm:"size:20;default:in_progress;not null" json:"status"` // in_progress | completed | timed_out | disqualified
	ResultApproved bool       `gorm:"default:false" json:"result_approved"`               // admin natijani tasdiqlagan
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Olympiad *Olympiad `gorm:"foreignKey:OlympiadID" json:"olympiad,omitempty"`
	Answers  []OlympiadAttemptAnswer `gorm:"foreignKey:AttemptID;constraint:OnDelete:CASCADE" json:"answers,omitempty"`
}

// OlympiadAttemptAnswer — olimpiadadagi har bir javob
type OlympiadAttemptAnswer struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	AttemptID        uint      `gorm:"not null;index" json:"attempt_id"`
	QuestionID       uint      `gorm:"not null;index" json:"question_id"`
	SelectedOptionID *uint     `json:"selected_option_id"`
	IsCorrect        bool      `gorm:"default:false" json:"is_correct"`
	AnsweredAt       time.Time `gorm:"autoCreateTime" json:"answered_at"`

	// Relations
	Question       *Question       `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
	SelectedOption *QuestionOption `gorm:"foreignKey:SelectedOptionID" json:"selected_option,omitempty"`
}

func (OlympiadAttempt) TableName() string { return "olympiad_attempt" }
func (OlympiadAttemptAnswer) TableName() string { return "olympiad_attempt_answer" }
