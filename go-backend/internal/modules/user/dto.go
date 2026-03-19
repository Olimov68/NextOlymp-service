package user

type CompleteProfileRequest struct {
	FirstName  string `form:"first_name" json:"first_name" binding:"required,min=2,max=100"`
	LastName   string `form:"last_name" json:"last_name" binding:"required,min=2,max=100"`
	BirthDate  string `form:"birth_date" json:"birth_date" binding:"required"` // YYYY-MM-DD
	Gender     string `form:"gender" json:"gender" binding:"required,oneof=male female"`
	Region     string `form:"region" json:"region" binding:"required,min=2,max=100"`
	District   string `form:"district" json:"district" binding:"required,min=2,max=100"`
	SchoolName string `form:"school_name" json:"school_name" binding:"required,min=1,max=200"`
	Grade      int    `form:"grade" json:"grade" binding:"required,min=1,max=12"`
}

type UpdateProfileRequest struct {
	FirstName  string `form:"first_name" json:"first_name" binding:"omitempty,min=2,max=100"`
	LastName   string `form:"last_name" json:"last_name" binding:"omitempty,min=2,max=100"`
	BirthDate  string `form:"birth_date" json:"birth_date" binding:"omitempty"`
	Gender     string `form:"gender" json:"gender" binding:"omitempty,oneof=male female"`
	Region     string `form:"region" json:"region" binding:"omitempty,min=2,max=100"`
	District   string `form:"district" json:"district" binding:"omitempty,min=2,max=100"`
	SchoolName string `form:"school_name" json:"school_name" binding:"omitempty,min=1,max=200"`
	Grade      int    `form:"grade" json:"grade" binding:"omitempty,min=1,max=12"`
}
