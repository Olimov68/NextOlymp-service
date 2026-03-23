package models

import "time"

// AIAnalysis — AI tomonidan yaratilgan test tahlili (cache)
type AIAnalysis struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	AttemptID   uint   `gorm:"not null;uniqueIndex" json:"attempt_id"`
	AttemptType string `gorm:"size:20;not null;default:mock_test" json:"attempt_type"` // mock_test | olympiad
	UserID      uint   `gorm:"not null;index" json:"user_id"`

	// AI generated content
	OverallGrade     string `gorm:"size:10" json:"overall_grade"`       // A+, A, B, C, D
	Summary          string `gorm:"type:text" json:"summary"`           // Umumiy baho
	Strengths        string `gorm:"type:text" json:"strengths"`         // JSON array of strengths
	Weaknesses       string `gorm:"type:text" json:"weaknesses"`        // JSON array of weaknesses
	QuestionAnalysis string `gorm:"type:text" json:"question_analysis"` // JSON array of wrong answer analyses
	Recommendations  string `gorm:"type:text" json:"recommendations"`   // JSON array of study tips
	Motivation       string `gorm:"type:text" json:"motivation"`        // Motivational message

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (AIAnalysis) TableName() string { return "ai_analysis" }
