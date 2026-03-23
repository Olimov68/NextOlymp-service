package samocktests

import (
	"fmt"
	"strings"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(params ListParams) ([]models.MockTest, int64, error) {
	return s.repo.List(params)
}

func (s *Service) GetByID(id uint) (*models.MockTest, error) {
	return s.repo.GetByID(id)
}

func (s *Service) Create(req *CreateRequest, staffID uint) (*models.MockTest, error) {
	slug := generateSlug(req.Title)
	base := slug
	counter := 1
	for s.repo.SlugExists(slug) {
		slug = fmt.Sprintf("%s-%d", base, counter)
		counter++
	}

	status := models.MockTestStatusDraft
	if req.Status != "" {
		status = models.MockTestStatus(req.Status)
	}
	lang := "uz"
	if req.Language != "" {
		lang = req.Language
	}
	scoring := "standard"
	if req.ScoringType != "" {
		scoring = req.ScoringType
	}

	m := &models.MockTest{
		Title:                 req.Title,
		Slug:                  slug,
		Description:           req.Description,
		Subject:               req.Subject,
		Grade:                 req.Grade,
		Language:              lang,
		DurationMins:          req.DurationMins,
		TotalQuestions:        req.TotalQuestions,
		Rules:                 req.Rules,
		ScoringType:           scoring,
		Status:                status,
		IsPaid:                req.IsPaid,
		Price:                 req.Price,
		CreatedByID:           &staffID,
		BannerURL:             req.BannerURL,
		IconURL:               req.IconURL,
		MaxSeats:              req.MaxSeats,
		ShuffleQuestions:      req.ShuffleQuestions,
		ShuffleAnswers:        req.ShuffleAnswers,
		AutoSubmit:            req.AutoSubmit,
		AllowRetake:           req.AllowRetake,
		ShowResultImmediately: req.ShowResultImmediately,
		GiveCertificate:       req.GiveCertificate,
		ManualReview:          req.ManualReview,
		AdminApproval:         req.AdminApproval,
	}

	if req.StartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.StartTime)
		if err == nil {
			m.StartTime = &t
		}
	}
	if req.EndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.EndTime)
		if err == nil {
			m.EndTime = &t
		}
	}
	if req.RegistrationStartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationStartTime)
		if err == nil {
			m.RegistrationStartTime = &t
		}
	}
	if req.RegistrationEndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationEndTime)
		if err == nil {
			m.RegistrationEndTime = &t
		}
	}

	if err := s.repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) Update(id uint, req *UpdateRequest) (*models.MockTest, error) {
	fields := map[string]interface{}{}
	if req.Title != nil {
		fields["title"] = *req.Title
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.Subject != nil {
		fields["subject"] = *req.Subject
	}
	if req.Grade != nil {
		fields["grade"] = *req.Grade
	}
	if req.Language != nil {
		fields["language"] = *req.Language
	}
	if req.DurationMins != nil {
		fields["duration_mins"] = *req.DurationMins
	}
	if req.TotalQuestions != nil {
		fields["total_questions"] = *req.TotalQuestions
	}
	if req.ScoringType != nil {
		fields["scoring_type"] = *req.ScoringType
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}
	if req.IsPaid != nil {
		fields["is_paid"] = *req.IsPaid
	}
	if req.Price != nil {
		fields["price"] = *req.Price
	}
	if req.Rules != nil {
		fields["rules"] = *req.Rules
	}
	if req.BannerURL != nil {
		fields["banner_url"] = *req.BannerURL
	}
	if req.IconURL != nil {
		fields["icon_url"] = *req.IconURL
	}
	if req.MaxSeats != nil {
		fields["max_seats"] = *req.MaxSeats
	}
	if req.ShuffleQuestions != nil {
		fields["shuffle_questions"] = *req.ShuffleQuestions
	}
	if req.ShuffleAnswers != nil {
		fields["shuffle_answers"] = *req.ShuffleAnswers
	}
	if req.AutoSubmit != nil {
		fields["auto_submit"] = *req.AutoSubmit
	}
	if req.AllowRetake != nil {
		fields["allow_retake"] = *req.AllowRetake
	}
	if req.ShowResultImmediately != nil {
		fields["show_result_immediately"] = *req.ShowResultImmediately
	}
	if req.GiveCertificate != nil {
		fields["give_certificate"] = *req.GiveCertificate
	}
	if req.ManualReview != nil {
		fields["manual_review"] = *req.ManualReview
	}
	if req.AdminApproval != nil {
		fields["admin_approval"] = *req.AdminApproval
	}
	if req.StartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.StartTime)
		if err == nil {
			fields["start_time"] = t
		}
	}
	if req.EndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.EndTime)
		if err == nil {
			fields["end_time"] = t
		}
	}
	if req.RegistrationStartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationStartTime)
		if err == nil {
			fields["registration_start_time"] = t
		}
	}
	if req.RegistrationEndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationEndTime)
		if err == nil {
			fields["registration_end_time"] = t
		}
	}

	if err := s.repo.Update(id, fields); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) ListRegistrations(mockTestID uint, page, pageSize int) ([]models.MockTestRegistration, int64, error) {
	return s.repo.ListRegistrations(mockTestID, page, pageSize)
}

func (s *Service) ListParticipants(mockTestID uint, page, pageSize int) ([]models.MockTestRegistration, int64, error) {
	return s.repo.ListParticipants(mockTestID, page, pageSize)
}

func (s *Service) ListResults(mockTestID uint, page, pageSize int) ([]models.MockAttempt, int64, error) {
	return s.repo.ListResults(mockTestID, page, pageSize)
}

func (s *Service) ApproveResult(resultID uint) error {
	attempt, err := s.repo.GetAttemptByID(resultID)
	if err != nil {
		return err
	}
	_ = attempt
	return s.repo.UpdateAttempt(resultID, map[string]interface{}{
		"status": "approved",
	})
}

func (s *Service) Duplicate(id uint) (*models.MockTest, error) {
	orig, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	clone := *orig
	clone.ID = 0
	clone.Status = models.MockTestStatusDraft

	// Generate unique slug
	slug := orig.Slug + "-copy"
	base := slug
	counter := 1
	for s.repo.SlugExists(slug) {
		slug = fmt.Sprintf("%s-%d", base, counter)
		counter++
	}
	clone.Slug = slug
	clone.Title = orig.Title + " (Copy)"
	clone.CreatedAt = time.Time{}
	clone.UpdatedAt = time.Time{}

	if err := s.repo.Create(&clone); err != nil {
		return nil, err
	}
	return &clone, nil
}

func (s *Service) Publish(id uint) error {
	mt, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Savol soni tekshirish
	actualCount := s.repo.CountQuestions("mock_test", id)
	if mt.TotalQuestions > 0 && int64(mt.TotalQuestions) != actualCount {
		return fmt.Errorf("Mock testda %d ta savol bo'lishi kerak, hozirda %d ta mavjud. Avval savollarni to'ldiring", mt.TotalQuestions, actualCount)
	}
	if actualCount == 0 {
		return fmt.Errorf("Mock testda hech qanday savol yo'q. Avval savollar qo'shing")
	}

	return s.repo.UpdateStatus(id, models.MockTestStatusPublished)
}

func (s *Service) Unpublish(id uint) error {
	return s.repo.UpdateStatus(id, models.MockTestStatusDraft)
}

func generateSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		if r == ' ' || r == '-' || r == '_' {
			return '-'
		}
		return -1
	}, slug)
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("mock-test-%d", time.Now().Unix())
	}
	return slug
}
