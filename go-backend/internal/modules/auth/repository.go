package auth

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByIDWithProfile(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").Preload("TelegramLink").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UsernameExists(username string) (bool, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func (r *Repository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

// --- Google OAuth ---

func (r *Repository) GetByGoogleID(googleID string) (*models.User, error) {
	var user models.User
	err := r.db.Where("google_id = ?", googleID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// --- Recovery ---

// GetTelegramLinkByUserID — user ning telegram bog'lanishini olish
func (r *Repository) GetTelegramLinkByUserID(userID uint) (*models.TelegramLink, error) {
	var link models.TelegramLink
	err := r.db.Where("user_id = ?", userID).First(&link).Error
	return &link, err
}

// CreatePasswordResetCode — parol tiklash kodi yaratish
func (r *Repository) CreatePasswordResetCode(code *models.PasswordResetCode) error {
	return r.db.Create(code).Error
}

// DeleteUnusedPasswordResetCodes — user ning eski kodlarini o'chirish
func (r *Repository) DeleteUnusedPasswordResetCodes(userID uint) error {
	return r.db.Where("user_id = ? AND used = false", userID).Delete(&models.PasswordResetCode{}).Error
}

// GetValidPasswordResetCode — haqiqiy kodni olish
func (r *Repository) GetValidPasswordResetCode(userID uint, code string) (*models.PasswordResetCode, error) {
	var rc models.PasswordResetCode
	err := r.db.Where("user_id = ? AND code = ? AND used = false AND expires_at > ?", userID, code, time.Now()).First(&rc).Error
	return &rc, err
}

// GetVerifiedPasswordResetCode — tasdiqlangan kodni olish (parol o'zgartirishga ruxsat)
func (r *Repository) GetVerifiedPasswordResetCode(userID uint, code string) (*models.PasswordResetCode, error) {
	var rc models.PasswordResetCode
	err := r.db.Where("user_id = ? AND code = ? AND verified = true AND used = false AND expires_at > ?", userID, code, time.Now()).First(&rc).Error
	return &rc, err
}

// UpdatePasswordResetCode — kodni yangilash
func (r *Repository) UpdatePasswordResetCode(code *models.PasswordResetCode) error {
	return r.db.Save(code).Error
}
