package models

import "time"

// Question — savollar modeli (Olympiad va MockTest uchun umumiy)
type Question struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SourceType string    `gorm:"size:20;not null;index" json:"source_type"` // olympiad | mock_test
	SourceID   uint      `gorm:"not null;index" json:"source_id"`
	Text       string    `gorm:"type:text;not null" json:"text"`
	ImageURL   string    `gorm:"size:500" json:"image_url"`
	Difficulty string    `gorm:"size:20;default:medium;not null" json:"difficulty"` // easy | medium | hard
	Points     float64   `gorm:"default:1;not null" json:"points"`
	OrderNum   int       `gorm:"default:0;not null" json:"order_num"`
	RaschB     *float64  `json:"rasch_b,omitempty"`                        // Rasch difficulty parameter
	IsActive   bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Options []QuestionOption `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE" json:"options"`
}

// QuestionOption — javob variantlari
type QuestionOption struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	QuestionID uint      `gorm:"not null;index" json:"question_id"`
	Label      string    `gorm:"size:10;not null" json:"label"` // A, B, C, D
	Text       string    `gorm:"type:text;not null" json:"text"`
	ImageURL   string    `gorm:"size:500" json:"image_url"`
	IsCorrect  bool      `gorm:"default:false;not null" json:"is_correct"`
	OrderNum   int       `gorm:"default:0;not null" json:"order_num"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Question) TableName() string { return "question" }
func (QuestionOption) TableName() string { return "question_option" }
