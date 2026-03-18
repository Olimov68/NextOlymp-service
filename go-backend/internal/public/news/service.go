package publicnews

import (
	"errors"

	"gorm.io/gorm"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(params ListParams) (map[string]interface{}, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := s.repo.List(params)
	if err != nil {
		return nil, err
	}

	items := make([]NewsListItem, len(list))
	for i, c := range list {
		items[i] = toListItem(&c)
	}

	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	return map[string]interface{}{
		"items": items,
		"pagination": map[string]interface{}{
			"page":        params.Page,
			"page_size":   params.PageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	}, nil
}

func (s *Service) GetByID(id uint) (*NewsDetail, error) {
	c, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("news not found")
		}
		return nil, err
	}

	// Increment view count
	_ = s.repo.IncrementViewCount(c.ID)
	c.ViewCount++

	result := toDetail(c)
	return &result, nil
}

func (s *Service) GetBySlug(slug string) (*NewsDetail, error) {
	c, err := s.repo.GetBySlug(slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("news not found")
		}
		return nil, err
	}

	// Increment view count
	_ = s.repo.IncrementViewCount(c.ID)
	c.ViewCount++

	result := toDetail(c)
	return &result, nil
}
