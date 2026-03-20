package admintests

import (
	"fmt"
	"strings"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// --- Olympiad ---

func (r *Repository) ListOlympiads(params TestListParams) ([]models.Olympiad, int64, error) {
	var list []models.Olympiad
	var total int64
	q := r.db.Model(&models.Olympiad{})
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
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetOlympiadByID(id uint) (*models.Olympiad, error) {
	var o models.Olympiad
	err := r.db.First(&o, id).Error
	return &o, err
}

func (r *Repository) CreateOlympiad(o *models.Olympiad) error {
	return r.db.Create(o).Error
}

func (r *Repository) UpdateOlympiad(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.Olympiad{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) DeleteOlympiad(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// O'chirish tartibi: child -> parent

		// 1. Olimpiada attempt javoblarini o'chirish
		tx.Exec("DELETE FROM olympiad_attempt_answer WHERE attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)

		// 2. Anti-cheat violations
		tx.Exec("DELETE FROM anti_cheat_violations WHERE attempt_type = 'olympiad' AND attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)
		tx.Exec("DELETE FROM exam_violation WHERE attempt_id IN (SELECT id FROM olympiad_attempt WHERE olympiad_id = ?)", id)

		// 3. Olimpiada attemptlarini o'chirish
		tx.Exec("DELETE FROM olympiad_attempt WHERE olympiad_id = ?", id)

		// 4. Registratsiyalarni o'chirish
		tx.Exec("DELETE FROM olympiad_registration WHERE olympiad_id = ?", id)

		// 4.5. Olimpiada question stat
		tx.Exec("DELETE FROM olympiad_question_stat WHERE olympiad_id = ?", id)

		// 5. Sertifikatlarni o'chirish
		tx.Exec("DELETE FROM certificate WHERE source_type = 'olympiad' AND source_id = ?", id)

		// 6. Savollar va variantlarni o'chirish
		tx.Exec("DELETE FROM question_option WHERE question_id IN (SELECT id FROM question WHERE source_type = 'olympiad' AND source_id = ?)", id)
		tx.Exec("DELETE FROM question WHERE source_type = 'olympiad' AND source_id = ?", id)

		// 7. Bildirishnomalarni o'chirish (related)
		tx.Exec("DELETE FROM notification WHERE source_type = 'olympiad' AND source_id = ?", id)

		// 8. Olimpiadani o'chirish
		if err := tx.Delete(&models.Olympiad{}, id).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *Repository) SlugExists(table, slug string, excludeID uint) bool {
	var count int64
	q := r.db.Table(table).Where("slug = ?", slug)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

// --- MockTest ---

func (r *Repository) ListMockTests(params TestListParams) ([]models.MockTest, int64, error) {
	var list []models.MockTest
	var total int64
	q := r.db.Model(&models.MockTest{})
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
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetMockTestByID(id uint) (*models.MockTest, error) {
	var m models.MockTest
	err := r.db.First(&m, id).Error
	return &m, err
}

func (r *Repository) CreateMockTest(m *models.MockTest) error {
	return r.db.Create(m).Error
}

func (r *Repository) UpdateMockTest(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.MockTest{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) DeleteMockTest(id uint) error {
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

// generateSlug — oddiy slug generatsiya
func generateSlug(title string, id uint) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return fmt.Sprintf("%s-%d", slug, id)
}
