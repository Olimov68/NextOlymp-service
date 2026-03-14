package admintests

import (
	"errors"
	"fmt"
	"strings"

	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/shared/assessment"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func slugify(s string) string {
	return strings.ToLower(strings.ReplaceAll(s, " ", "-"))
}

// --- Olympiad ---

func (s *Service) ListOlympiads(params TestListParams) ([]OlympiadResponse, int64, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	list, total, err := s.repo.ListOlympiads(params)
	if err != nil {
		return nil, 0, err
	}
	items := make([]OlympiadResponse, len(list))
	for i, o := range list {
		items[i] = ToOlympiadResponse(&o)
	}
	return items, total, nil
}

func (s *Service) GetOlympiadByID(id uint) (*OlympiadResponse, error) {
	o, err := s.repo.GetOlympiadByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("olympiad not found")
		}
		return nil, err
	}
	res := ToOlympiadResponse(o)
	return &res, nil
}

func (s *Service) CreateOlympiad(req *CreateOlympiadRequest, createdByID uint) (*OlympiadResponse, error) {
	status := models.OlympiadStatusDraft
	if req.Status != "" {
		status = models.OlympiadStatus(req.Status)
	}

	o := &models.Olympiad{
		Title:          req.Title,
		Slug:           slugify(req.Title),
		Description:    req.Description,
		Subject:        req.Subject,
		Grade:          req.Grade,
		Language:       req.Language,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		DurationMins:   req.DurationMins,
		TotalQuestions: req.TotalQuestions,
		Rules:          req.Rules,
		Status:         status,
		IsPaid:         req.IsPaid,
		Price:          req.Price,
		CreatedByID:    &createdByID,
	}

	if err := s.repo.CreateOlympiad(o); err != nil {
		return nil, errors.New("failed to create olympiad")
	}

	// Slug unique qilish uchun ID ni qo'shish
	slug := fmt.Sprintf("%s-%d", slugify(req.Title), o.ID)
	s.repo.UpdateOlympiad(o.ID, map[string]interface{}{"slug": slug})
	o.Slug = slug

	res := ToOlympiadResponse(o)
	return &res, nil
}

func (s *Service) UpdateOlympiad(id uint, req *UpdateOlympiadRequest) (*OlympiadResponse, error) {
	o, err := s.repo.GetOlympiadByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("olympiad not found")
		}
		return nil, err
	}

	fields := map[string]interface{}{}
	if req.Title != nil {
		fields["title"] = *req.Title
		fields["slug"] = fmt.Sprintf("%s-%d", slugify(*req.Title), id)
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
	if req.StartTime != nil {
		fields["start_time"] = req.StartTime
	}
	if req.EndTime != nil {
		fields["end_time"] = req.EndTime
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

	if err := s.repo.UpdateOlympiad(id, fields); err != nil {
		return nil, errors.New("failed to update olympiad")
	}

	_ = o
	updated, _ := s.repo.GetOlympiadByID(id)
	res := ToOlympiadResponse(updated)
	return &res, nil
}

func (s *Service) DeleteOlympiad(id uint) error {
	_, err := s.repo.GetOlympiadByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("olympiad not found")
		}
		return err
	}
	return s.repo.DeleteOlympiad(id)
}

// --- MockTest ---

func (s *Service) ListMockTests(params TestListParams) ([]MockTestResponse, int64, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	list, total, err := s.repo.ListMockTests(params)
	if err != nil {
		return nil, 0, err
	}
	items := make([]MockTestResponse, len(list))
	for i, m := range list {
		items[i] = ToMockTestResponse(&m)
	}
	return items, total, nil
}

func (s *Service) GetMockTestByID(id uint) (*MockTestResponse, error) {
	m, err := s.repo.GetMockTestByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mock test not found")
		}
		return nil, err
	}
	res := ToMockTestResponse(m)
	return &res, nil
}

func (s *Service) CreateMockTest(req *CreateMockTestRequest, createdByID uint) (*MockTestResponse, error) {
	status := models.MockTestStatusDraft
	if req.Status != "" {
		status = models.MockTestStatus(req.Status)
	}
	scoringType := "simple"
	if req.ScoringType != "" {
		if !assessment.IsValidScoringType(req.ScoringType) {
			return nil, errors.New("scoring_type faqat 'simple' yoki 'rasch' bo'lishi mumkin")
		}
		scoringType = req.ScoringType
	}
	scalingFormulaType := "none"
	if req.ScalingFormulaType != "" {
		if !assessment.IsValidScalingFormula(req.ScalingFormulaType) {
			return nil, errors.New("scaling_formula_type faqat 'none', 'prop_93_65' yoki 'prop_63_65' bo'lishi mumkin")
		}
		scalingFormulaType = req.ScalingFormulaType
	}

	m := &models.MockTest{
		Title:              req.Title,
		Slug:               slugify(req.Title),
		Description:        req.Description,
		Subject:            req.Subject,
		Grade:              req.Grade,
		Language:            req.Language,
		DurationMins:       req.DurationMins,
		TotalQuestions:     req.TotalQuestions,
		ScoringType:        scoringType,
		ScalingFormulaType: scalingFormulaType,
		Status:             status,
		IsPaid:             req.IsPaid,
		Price:              req.Price,
		CreatedByID:        &createdByID,
	}

	if err := s.repo.CreateMockTest(m); err != nil {
		return nil, errors.New("failed to create mock test")
	}

	slug := fmt.Sprintf("%s-%d", slugify(req.Title), m.ID)
	s.repo.UpdateMockTest(m.ID, map[string]interface{}{"slug": slug})
	m.Slug = slug

	res := ToMockTestResponse(m)
	return &res, nil
}

func (s *Service) UpdateMockTest(id uint, req *UpdateMockTestRequest) (*MockTestResponse, error) {
	_, err := s.repo.GetMockTestByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mock test not found")
		}
		return nil, err
	}

	fields := map[string]interface{}{}
	if req.Title != nil {
		fields["title"] = *req.Title
		fields["slug"] = fmt.Sprintf("%s-%d", slugify(*req.Title), id)
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
		if !assessment.IsValidScoringType(*req.ScoringType) {
			return nil, errors.New("scoring_type faqat 'simple' yoki 'rasch' bo'lishi mumkin")
		}
		fields["scoring_type"] = *req.ScoringType
	}
	if req.ScalingFormulaType != nil {
		if !assessment.IsValidScalingFormula(*req.ScalingFormulaType) {
			return nil, errors.New("scaling_formula_type faqat 'none', 'prop_93_65' yoki 'prop_63_65' bo'lishi mumkin")
		}
		fields["scaling_formula_type"] = *req.ScalingFormulaType
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

	if err := s.repo.UpdateMockTest(id, fields); err != nil {
		return nil, errors.New("failed to update mock test")
	}

	updated, _ := s.repo.GetMockTestByID(id)
	res := ToMockTestResponse(updated)
	return &res, nil
}

func (s *Service) DeleteMockTest(id uint) error {
	_, err := s.repo.GetMockTestByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("mock test not found")
		}
		return err
	}
	return s.repo.DeleteMockTest(id)
}
