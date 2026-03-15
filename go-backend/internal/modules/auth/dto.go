package auth

import "github.com/nextolympservice/go-backend/internal/models"

// --- Request DTOs ---

type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=4,max=50"`
	Password        string `json:"password" binding:"required,min=8,max=128"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// --- Response DTOs ---

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
}

type RegisterResponse struct {
	User     UserResponse `json:"user"`
	Tokens   TokenPair    `json:"tokens"`
	NextStep string       `json:"next_step"` // yangi user uchun doim "complete_profile"
}

type LoginResponse struct {
	User     UserResponse `json:"user"`
	Tokens   TokenPair    `json:"tokens"`
	NextStep string       `json:"next_step"` // complete_profile | link_telegram | dashboard
}

type UserResponse struct {
	ID                 uint               `json:"id"`
	Username           string             `json:"username"`
	Status             models.UserStatus  `json:"status"`
	IsProfileCompleted bool               `json:"is_profile_completed"`
	IsTelegramLinked   bool               `json:"is_telegram_linked"`
	CreatedAt          string             `json:"created_at"`
}

type MeResponse struct {
	User     UserResponse     `json:"user"`
	Profile  *ProfileResponse `json:"profile,omitempty"`
	NextStep string           `json:"next_step"`
}

type ProfileResponse struct {
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	BirthDate  string `json:"birth_date"`
	Gender     string `json:"gender"`
	Region     string `json:"region"`
	District   string `json:"district"`
	SchoolName string `json:"school_name"`
	Grade      int    `json:"grade"`
	PhotoURL   string `json:"photo_url"`
}

// ToUserResponse converts User model to response DTO
func ToUserResponse(u *models.User) UserResponse {
	return UserResponse{
		ID:                 u.ID,
		Username:           u.Username,
		Status:             u.Status,
		IsProfileCompleted: u.IsProfileCompleted,
		IsTelegramLinked:   u.IsTelegramLinked,
		CreatedAt:          u.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// DetermineNextStep returns the next step for the user
func DetermineNextStep(u *models.User) string {
	if !u.IsProfileCompleted {
		return "complete_profile"
	}
	if !u.IsTelegramLinked {
		return "link_telegram"
	}
	return "dashboard"
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8,max=128"`
}

// --- Recovery DTOs ---

type RecoveryIdentifyRequest struct {
	Identifier string `json:"identifier" binding:"required"` // username
}

type RecoveryIdentifyResponse struct {
	Message string `json:"message"`
	BotURL  string `json:"bot_url"`
	BotName string `json:"bot_name"`
}

type RecoveryVerifyRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Code       string `json:"code" binding:"required,len=6"`
}

type RecoveryResetRequest struct {
	Identifier  string `json:"identifier" binding:"required"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=128"`
}

func ToProfileResponse(p *models.Profile) *ProfileResponse {
	if p == nil {
		return nil
	}
	return &ProfileResponse{
		FirstName:  p.FirstName,
		LastName:   p.LastName,
		BirthDate:  p.BirthDate,
		Gender:     string(p.Gender),
		Region:     p.Region,
		District:   p.District,
		SchoolName: p.SchoolName,
		Grade:      p.Grade,
		PhotoURL:   p.PhotoURL,
	}
}
