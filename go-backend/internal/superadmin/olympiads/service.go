package saolympiads

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

func (s *Service) List(params ListParams) ([]models.Olympiad, int64, error) {
	return s.repo.List(params)
}

func (s *Service) GetByID(id uint) (*models.Olympiad, error) {
	return s.repo.GetByID(id)
}

func (s *Service) Create(req *CreateRequest, staffID uint) (*models.Olympiad, error) {
	slug := generateSlug(req.Title)
	// Ensure unique slug
	base := slug
	counter := 1
	for s.repo.SlugExists(slug) {
		slug = fmt.Sprintf("%s-%d", base, counter)
		counter++
	}

	status := models.OlympiadStatusDraft
	if req.Status != "" {
		status = models.OlympiadStatus(req.Status)
	}
	lang := "uz"
	if req.Language != "" {
		lang = req.Language
	}

	o := &models.Olympiad{
		Title:          req.Title,
		Slug:           slug,
		Description:    req.Description,
		Subject:        req.Subject,
		Grade:          req.Grade,
		Language:       lang,
		DurationMins:   req.DurationMins,
		TotalQuestions: req.TotalQuestions,
		Rules:          req.Rules,
		Status:         status,
		IsPaid:         req.IsPaid,
		Price:          req.Price,
		CreatedByID:    &staffID,

		BannerURL: req.BannerURL,
		IconURL:   req.IconURL,
		MaxSeats:  req.MaxSeats,

		ShuffleQuestions:      req.ShuffleQuestions,
		ShuffleAnswers:        req.ShuffleAnswers,
		AutoSubmit:            req.AutoSubmit,
		AllowRetake:           req.AllowRetake,
		ShowResultImmediately: req.ShowResultImmediately,
		GiveCertificate:       req.GiveCertificate,
		ManualReview:          req.ManualReview,
		AdminApproval:         req.AdminApproval,

		MinScoreForCertificate: req.MinScoreForCertificate,
		ScoringRules:           req.ScoringRules,
	}

	if req.StartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.StartTime)
		if err == nil {
			o.StartTime = &t
		}
	}
	if req.EndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.EndTime)
		if err == nil {
			o.EndTime = &t
		}
	}
	if req.RegistrationStartTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationStartTime)
		if err == nil {
			o.RegistrationStartTime = &t
		}
	}
	if req.RegistrationEndTime != nil {
		t, err := time.Parse(time.RFC3339, *req.RegistrationEndTime)
		if err == nil {
			o.RegistrationEndTime = &t
		}
	}

	if err := s.repo.Create(o); err != nil {
		return nil, err
	}
	return o, nil
}

func (s *Service) Update(id uint, req *UpdateRequest) (*models.Olympiad, error) {
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
	if req.Rules != nil {
		fields["rules"] = *req.Rules
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

	// Media
	if req.BannerURL != nil {
		fields["banner_url"] = *req.BannerURL
	}
	if req.IconURL != nil {
		fields["icon_url"] = *req.IconURL
	}

	// Registration
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
	if req.MaxSeats != nil {
		fields["max_seats"] = *req.MaxSeats
	}

	// Settings
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
	if req.MinScoreForCertificate != nil {
		fields["min_score_for_certificate"] = *req.MinScoreForCertificate
	}
	if req.ScoringRules != nil {
		fields["scoring_rules"] = *req.ScoringRules
	}

	if err := s.repo.Update(id, fields); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

// ListRegistrations returns paginated registrations for an olympiad
func (s *Service) ListRegistrations(olympiadID uint, page, pageSize int) ([]models.OlympiadRegistration, int64, error) {
	return s.repo.ListRegistrations(olympiadID, nil, page, pageSize)
}

// ListParticipants returns registrations with status participant or completed
func (s *Service) ListParticipants(olympiadID uint, page, pageSize int) ([]models.OlympiadRegistration, int64, error) {
	return s.repo.ListRegistrations(olympiadID, []string{"participant", "completed"}, page, pageSize)
}

// ListResults returns paginated attempt results for an olympiad
func (s *Service) ListResults(olympiadID uint, page, pageSize int) ([]models.OlympiadAttempt, int64, error) {
	return s.repo.ListAttempts(olympiadID, page, pageSize)
}

// ApproveResult sets the attempt status to approved
func (s *Service) ApproveResult(resultID uint) error {
	return s.repo.UpdateAttempt(resultID, map[string]interface{}{"status": "approved"})
}

// Duplicate clones an olympiad with a new slug and draft status
func (s *Service) Duplicate(id uint) (*models.Olympiad, error) {
	src, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	dup := *src
	dup.ID = 0
	dup.Slug = fmt.Sprintf("%s-copy-%d", src.Slug, time.Now().Unix())
	dup.Status = models.OlympiadStatusDraft
	dup.CreatedAt = time.Time{}
	dup.UpdatedAt = time.Time{}

	if err := s.repo.Create(&dup); err != nil {
		return nil, err
	}
	return &dup, nil
}

// Publish sets the olympiad status to published (savol soni tekshiriladi)
func (s *Service) Publish(id uint) error {
	o, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Savol soni tekshirish — total_questions bilan haqiqiy savollar soni mos bo'lishi shart
	actualCount := s.repo.CountQuestions("olympiad", id)
	if o.TotalQuestions > 0 && int64(o.TotalQuestions) != actualCount {
		return fmt.Errorf("Olimpiadada %d ta savol bo'lishi kerak, hozirda %d ta mavjud. Avval savollarni to'ldiring", o.TotalQuestions, actualCount)
	}
	if actualCount == 0 {
		return fmt.Errorf("Olimpiadada hech qanday savol yo'q. Avval savollar qo'shing")
	}

	return s.repo.UpdateStatus(id, string(models.OlympiadStatusPublished))
}

// Unpublish sets the olympiad status to draft
func (s *Service) Unpublish(id uint) error {
	return s.repo.UpdateStatus(id, string(models.OlympiadStatusDraft))
}

// ToggleRegistration — ro'yxatdan o'tishni ochish/yopish
func (s *Service) ToggleRegistration(id uint, open bool) error {
	return s.repo.UpdateField(id, "registration_open", open)
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
	// Remove multiple consecutive hyphens
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("olympiad-%d", time.Now().Unix())
	}
	return slug
}
