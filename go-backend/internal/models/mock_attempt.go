package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// JSONB — PostgreSQL JSONB field uchun custom type
type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("JSONB.Scan: type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, j)
}

// MockAttempt — foydalanuvchining test topshirish urinishi
type MockAttempt struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	UserID     uint       `gorm:"not null;index" json:"user_id"`
	MockTestID uint       `gorm:"not null;index" json:"mock_test_id"`
	StartedAt  time.Time  `gorm:"not null" json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`

	// Raw score fields
	Score      float64 `gorm:"default:0" json:"score"`
	MaxScore   float64 `gorm:"default:0" json:"max_score"`
	Correct    int     `gorm:"default:0" json:"correct"`
	Wrong      int     `gorm:"default:0" json:"wrong"`
	Unanswered int     `gorm:"default:0" json:"unanswered"`
	Percentage float64 `gorm:"default:0" json:"percentage"`

	// Rasch scoring fields
	ScoringType string   `gorm:"size:50;default:simple" json:"scoring_type"`   // simple | rasch
	ThetaScore  *float64 `json:"theta_score,omitempty"`                        // Rasch ability estimate
	ZScore      *float64 `json:"z_score,omitempty"`                            // Z = (theta - mu) / sigma
	TScore      *float64 `json:"t_score,omitempty"`                            // T = 50 + 10*Z
	ScaledScore *float64 `json:"scaled_score,omitempty"`                       // Proporsional scaling natijasi
	GradeLabel  string   `gorm:"size:20" json:"grade_label,omitempty"`         // A+, A, B+, B, C+, C, C dan quyi

	// Calculation audit trail
	CalculationMeta *JSONB `gorm:"type:jsonb" json:"calculation_meta,omitempty"`

	TimeTaken int    `gorm:"default:0" json:"time_taken"`                              // sekundlarda
	Status    string `gorm:"size:20;default:in_progress;not null" json:"status"`        // in_progress | completed | timed_out | abandoned
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	User     *User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MockTest *MockTest           `gorm:"foreignKey:MockTestID" json:"mock_test,omitempty"`
	Answers  []MockAttemptAnswer `gorm:"foreignKey:AttemptID;constraint:OnDelete:CASCADE" json:"answers,omitempty"`
}

// MockTestQuestionStat — Rasch modeli uchun savol qiyinchilik parametri
type MockTestQuestionStat struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	MockTestID      uint      `gorm:"not null;index" json:"mock_test_id"`
	QuestionID      uint      `gorm:"not null;index" json:"question_id"`
	DifficultyValue float64   `gorm:"default:0" json:"difficulty_value"` // Rasch item difficulty (logit)
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	MockTest *MockTest `gorm:"foreignKey:MockTestID" json:"mock_test,omitempty"`
	Question *Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// MockAttemptAnswer — urinishdagi har bir javob
type MockAttemptAnswer struct {
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
