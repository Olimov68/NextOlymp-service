package publicresults

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

// completedStatuses — faqat yakunlangan natijalar
var completedStatuses = []string{"completed", "timed_out"}

// nonDraftStatuses — faqat public bo'lgan olympiad/mocktest statuslari
var nonDraftStatuses = []string{"published", "active", "ended", "archived"}

func (r *Repository) ListOlympiadAttempts(params ListParams) ([]models.OlympiadAttempt, int64, error) {
	var list []models.OlympiadAttempt
	var total int64

	q := r.db.Model(&models.OlympiadAttempt{}).
		Joins("JOIN olympiad ON olympiad.id = olympiad_attempt.olympiad_id").
		Where("olympiad_attempt.status IN ?", completedStatuses).
		Where("olympiad.status IN ?", nonDraftStatuses)

	if params.SourceID > 0 {
		q = q.Where("olympiad_attempt.olympiad_id = ?", params.SourceID)
	}

	if params.Subject != "" {
		q = q.Where("olympiad.subject ILIKE ?", "%"+params.Subject+"%")
	}

	if params.Search != "" {
		q = q.Joins("LEFT JOIN \"user\" ON \"user\".id = olympiad_attempt.user_id").
			Joins("LEFT JOIN profile ON profile.user_id = \"user\".id").
			Where("profile.first_name ILIKE ? OR profile.last_name ILIKE ? OR \"user\".username ILIKE ?",
				"%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("User.Profile").Preload("Olympiad").
		Order("olympiad_attempt.score DESC, olympiad_attempt.created_at DESC").
		Offset(offset).Limit(params.PageSize).
		Find(&list).Error

	return list, total, err
}

func (r *Repository) ListMockAttempts(params ListParams) ([]models.MockAttempt, int64, error) {
	var list []models.MockAttempt
	var total int64

	q := r.db.Model(&models.MockAttempt{}).
		Joins("JOIN mock_test ON mock_test.id = mock_attempt.mock_test_id").
		Where("mock_attempt.status IN ?", completedStatuses).
		Where("mock_test.status IN ?", nonDraftStatuses)

	if params.SourceID > 0 {
		q = q.Where("mock_attempt.mock_test_id = ?", params.SourceID)
	}

	if params.Subject != "" {
		q = q.Where("mock_test.subject ILIKE ?", "%"+params.Subject+"%")
	}

	if params.Search != "" {
		q = q.Joins("LEFT JOIN \"user\" ON \"user\".id = mock_attempt.user_id").
			Joins("LEFT JOIN profile ON profile.user_id = \"user\".id").
			Where("profile.first_name ILIKE ? OR profile.last_name ILIKE ? OR \"user\".username ILIKE ?",
				"%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("User.Profile").Preload("MockTest").
		Order("mock_attempt.score DESC, mock_attempt.created_at DESC").
		Offset(offset).Limit(params.PageSize).
		Find(&list).Error

	return list, total, err
}
