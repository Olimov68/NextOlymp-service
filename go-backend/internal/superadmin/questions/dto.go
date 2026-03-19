package questions

// CreateQuestionRequest — yangi savol yaratish
type CreateQuestionRequest struct {
	SourceType string                `json:"source_type" binding:"required,oneof=olympiad mock_test"`
	SourceID   uint                  `json:"source_id" binding:"required,min=1"`
	Text       string                `json:"text" binding:"required,min=1,max=5000"`
	ImageURL   string                `json:"image_url" binding:"omitempty"`
	Difficulty string                `json:"difficulty" binding:"required,oneof=easy medium hard"`
	Points     float64               `json:"points" binding:"required,min=0.5,max=100"`
	OrderNum   int                   `json:"order_num" binding:"min=0"`
	Options    []CreateOptionRequest `json:"options" binding:"required,min=2,max=6,dive"`
}

type CreateOptionRequest struct {
	Label     string `json:"label" binding:"required,min=1,max=10"`
	Text      string `json:"text" binding:"required,min=1,max=2000"`
	ImageURL  string `json:"image_url" binding:"omitempty"`
	IsCorrect bool   `json:"is_correct"`
	OrderNum  int    `json:"order_num" binding:"min=0"`
}

// UpdateQuestionRequest — savolni yangilash
type UpdateQuestionRequest struct {
	Text       string                `json:"text" binding:"omitempty,min=5,max=5000"`
	ImageURL   string                `json:"image_url" binding:"omitempty"`
	Difficulty string                `json:"difficulty" binding:"omitempty,oneof=easy medium hard"`
	Points     float64               `json:"points" binding:"omitempty,min=0.5,max=100"`
	OrderNum   *int                  `json:"order_num"`
	IsActive   *bool                 `json:"is_active"`
	Options    []UpdateOptionRequest `json:"options"`
}

type UpdateOptionRequest struct {
	ID        *uint  `json:"id"`
	Label     string `json:"label" binding:"required,min=1,max=10"`
	Text      string `json:"text" binding:"required,min=1,max=2000"`
	ImageURL  string `json:"image_url"`
	IsCorrect bool   `json:"is_correct"`
	OrderNum  int    `json:"order_num"`
}

// BulkCreateQuestionsRequest — bir nechta savol yaratish
type BulkCreateQuestionsRequest struct {
	Questions []CreateQuestionRequest `json:"questions" binding:"required,min=1,dive"`
}

// ListQuestionsParams — filtr
type ListQuestionsParams struct {
	SourceType string `form:"source_type" binding:"omitempty,oneof=olympiad mock_test"`
	SourceID   uint   `form:"source_id"`
	Difficulty string `form:"difficulty" binding:"omitempty,oneof=easy medium hard"`
	Search     string `form:"search"`
	IsActive   *bool  `form:"is_active"`
	Page       int    `form:"page,default=1" binding:"min=1"`
	Limit      int    `form:"limit,default=20" binding:"min=1,max=100"`
}
