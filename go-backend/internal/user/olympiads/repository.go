package userolympiads

import (
	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(params ListParams) ([]models.Olympiad, int64, error) {
	var list []models.Olympiad
	var total int64

	q := r.db.Model(&models.Olympiad{}).Where("status IN ?", []string{
		string(models.OlympiadStatusPublished),
		string(models.OlympiadStatusActive),
		string(models.OlympiadStatusEnded),
	})

	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject = ?", params.Subject)
	}
	if params.Grade > 0 {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.Olympiad, error) {
	var o models.Olympiad
	err := r.db.Where("id = ? AND status IN ?", id, []string{
		string(models.OlympiadStatusPublished),
		string(models.OlympiadStatusActive),
		string(models.OlympiadStatusEnded),
	}).First(&o).Error
	return &o, err
}

func (r *Repository) GetMyOlympiads(userID uint) ([]models.OlympiadRegistration, error) {
	var list []models.OlympiadRegistration
	err := r.db.Preload("Olympiad").Where("user_id = ?", userID).Order("joined_at DESC").Find(&list).Error
	return list, err
}

func (r *Repository) GetRegistration(userID, olympiadID uint) (*models.OlympiadRegistration, error) {
	var reg models.OlympiadRegistration
	err := r.db.Where("user_id = ? AND olympiad_id = ?", userID, olympiadID).First(&reg).Error
	return &reg, err
}

func (r *Repository) CountRegistrations(olympiadID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.OlympiadRegistration{}).
		Where("olympiad_id = ? AND status != ?", olympiadID, string(models.OlympiadRegStatusCancelled)).
		Count(&count).Error
	return count, err
}

func (r *Repository) CreateRegistration(reg *models.OlympiadRegistration) error {
	return r.db.Create(reg).Error
}

// GetLatestAttempt — user ning oxirgi urinishini olish
func (r *Repository) GetLatestAttempt(userID, olympiadID uint) (*models.OlympiadAttempt, error) {
	var attempt models.OlympiadAttempt
	err := r.db.Where("user_id = ? AND olympiad_id = ?", userID, olympiadID).
		Order("created_at DESC").First(&attempt).Error
	return &attempt, err
}

// GetUserProfile — foydalanuvchi profilini olish
func (r *Repository) GetUserProfile(userID uint) (*models.Profile, error) {
	var profile models.Profile
	err := r.db.Where("user_id = ?", userID).First(&profile).Error
	return &profile, err
}
