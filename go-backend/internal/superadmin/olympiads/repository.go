package saolympiads

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
	q := r.db.Model(&models.Olympiad{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject ILIKE ?", "%"+params.Subject+"%")
	}
	if params.Search != "" {
		q = q.Where("title ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	if params.Grade != nil {
		q = q.Where("grade = ?", *params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.Olympiad, error) {
	var o models.Olympiad
	err := r.db.First(&o, id).Error
	return &o, err
}

func (r *Repository) SlugExists(slug string) bool {
	var count int64
	r.db.Model(&models.Olympiad{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *Repository) Create(o *models.Olympiad) error {
	return r.db.Create(o).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.Olympiad{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Exec("DELETE FROM olympiad_attempt_answer WHERE attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)
		tx.Exec("DELETE FROM anti_cheat_violations WHERE attempt_type = 'olympiad' AND attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)
		tx.Exec("DELETE FROM exam_violation WHERE attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)
		tx.Exec("DELETE FROM olympiad_attempt WHERE olympiad_id = ?", id)
		tx.Exec("DELETE FROM olympiad_registration WHERE olympiad_id = ?", id)
		tx.Exec("DELETE FROM olympiad_question_stat WHERE olympiad_id = ?", id)
		tx.Exec("DELETE FROM certificate WHERE source_type = 'olympiad' AND source_id = ?", id)
		tx.Exec("DELETE FROM question_option WHERE question_id IN (SELECT id FROM question WHERE source_type = 'olympiad' AND source_id = ?)", id)
		tx.Exec("DELETE FROM question WHERE source_type = 'olympiad' AND source_id = ?", id)
		tx.Exec("DELETE FROM notification WHERE source_type = 'olympiad' AND source_id = ?", id)
		if err := tx.Delete(&models.Olympiad{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

// ListRegistrations returns paginated registrations for an olympiad with user info
func (r *Repository) ListRegistrations(olympiadID uint, statuses []string, page, pageSize int) ([]models.OlympiadRegistration, int64, error) {
	var list []models.OlympiadRegistration
	var total int64
	q := r.db.Model(&models.OlympiadRegistration{}).Where("olympiad_id = ?", olympiadID)
	if len(statuses) > 0 {
		q = q.Where("status IN ?", statuses)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Preload("User.Profile").
		Order("joined_at DESC").Offset(offset).Limit(pageSize).
		Find(&list).Error
	return list, total, err
}

// ListAttempts returns paginated attempts for an olympiad with user info
func (r *Repository) ListAttempts(olympiadID uint, page, pageSize int) ([]models.OlympiadAttempt, int64, error) {
	var list []models.OlympiadAttempt
	var total int64
	q := r.db.Model(&models.OlympiadAttempt{}).Where("olympiad_id = ?", olympiadID)
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Preload("User.Profile").
		Order("rank ASC, score DESC").Offset(offset).Limit(pageSize).
		Find(&list).Error
	return list, total, err
}

// GetAttemptByID returns a single attempt by ID
func (r *Repository) GetAttemptByID(id uint) (*models.OlympiadAttempt, error) {
	var a models.OlympiadAttempt
	err := r.db.First(&a, id).Error
	return &a, err
}

// UpdateAttempt updates fields on an attempt
func (r *Repository) UpdateAttempt(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.OlympiadAttempt{}).Where("id = ?", id).Updates(fields).Error
}

// CreateOlympiad creates a new olympiad (used by Duplicate)
func (r *Repository) CreateOlympiad(o *models.Olympiad) error {
	return r.db.Create(o).Error
}

// UpdateStatus updates only the status of an olympiad
func (r *Repository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Olympiad{}).Where("id = ?", id).Update("status", status).Error
}
