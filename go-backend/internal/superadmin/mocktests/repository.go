package samocktests

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

func (r *Repository) List(params ListParams) ([]models.MockTest, int64, error) {
	var list []models.MockTest
	var total int64
	q := r.db.Model(&models.MockTest{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject ILIKE ?", "%"+params.Subject+"%")
	}
	if params.Grade != 0 {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	if params.Search != "" {
		q = q.Where("title ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.MockTest, error) {
	var m models.MockTest
	err := r.db.First(&m, id).Error
	return &m, err
}

func (r *Repository) SlugExists(slug string) bool {
	var count int64
	r.db.Model(&models.MockTest{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *Repository) Create(m *models.MockTest) error {
	return r.db.Create(m).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.MockTest{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Exec("DELETE FROM mock_attempt_answer WHERE attempt_id IN (SELECT id FROM mock_attempt WHERE mock_test_id = ?)", id)
		tx.Exec("DELETE FROM anti_cheat_violations WHERE attempt_type = 'mock_test' AND attempt_id IN (SELECT id FROM mock_attempt WHERE mock_test_id = ?)", id)
		tx.Exec("DELETE FROM exam_violation WHERE attempt_id IN (SELECT id FROM mock_attempt WHERE mock_test_id = ?)", id)
		tx.Exec("DELETE FROM mock_attempt WHERE mock_test_id = ?", id)
		tx.Exec("DELETE FROM mock_test_registration WHERE mock_test_id = ?", id)
		tx.Exec("DELETE FROM mock_test_question_stat WHERE mock_test_id = ?", id)
		tx.Exec("DELETE FROM certificate WHERE source_type = 'mock_test' AND source_id = ?", id)
		tx.Exec("DELETE FROM question_option WHERE question_id IN (SELECT id FROM question WHERE source_type = 'mock_test' AND source_id = ?)", id)
		tx.Exec("DELETE FROM question WHERE source_type = 'mock_test' AND source_id = ?", id)
		tx.Exec("DELETE FROM notification WHERE source_type = 'mock_test' AND source_id = ?", id)
		if err := tx.Delete(&models.MockTest{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

// ListRegistrations returns paginated registrations for a mock test
func (r *Repository) ListRegistrations(mockTestID uint, page, pageSize int) ([]models.MockTestRegistration, int64, error) {
	var list []models.MockTestRegistration
	var total int64
	q := r.db.Model(&models.MockTestRegistration{}).Where("mock_test_id = ?", mockTestID)
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Preload("User.Profile").
		Order("joined_at DESC").Offset(offset).Limit(pageSize).
		Find(&list).Error
	return list, total, err
}

// ListParticipants returns registrations where user completed or has in-progress attempts
func (r *Repository) ListParticipants(mockTestID uint, page, pageSize int) ([]models.MockTestRegistration, int64, error) {
	var list []models.MockTestRegistration
	var total int64
	q := r.db.Model(&models.MockTestRegistration{}).
		Where("mock_test_id = ?", mockTestID).
		Where("status = ? OR user_id IN (?)",
			models.MockTestRegStatusCompleted,
			r.db.Model(&models.MockAttempt{}).Select("user_id").Where("mock_test_id = ?", mockTestID),
		)
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Preload("User.Profile").
		Order("joined_at DESC").Offset(offset).Limit(pageSize).
		Find(&list).Error
	return list, total, err
}

// ListResults returns paginated mock attempts for a mock test
func (r *Repository) ListResults(mockTestID uint, page, pageSize int) ([]models.MockAttempt, int64, error) {
	var list []models.MockAttempt
	var total int64
	q := r.db.Model(&models.MockAttempt{}).Where("mock_test_id = ?", mockTestID)
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Preload("User.Profile").
		Order("created_at DESC").Offset(offset).Limit(pageSize).
		Find(&list).Error
	return list, total, err
}

// GetAttemptByID returns a single mock attempt by ID
func (r *Repository) GetAttemptByID(id uint) (*models.MockAttempt, error) {
	var a models.MockAttempt
	err := r.db.First(&a, id).Error
	return &a, err
}

// UpdateAttempt updates fields on a mock attempt
func (r *Repository) UpdateAttempt(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.MockAttempt{}).Where("id = ?", id).Updates(fields).Error
}

// UpdateStatus sets the status of a mock test
func (r *Repository) UpdateStatus(id uint, status models.MockTestStatus) error {
	return r.db.Model(&models.MockTest{}).Where("id = ?", id).Update("status", status).Error
}
