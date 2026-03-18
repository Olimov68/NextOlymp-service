package publicresults

import "sort"

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

	// Agar source_type berilgan bo'lsa, faqat shu type natijalarni olamiz
	if params.SourceType == "olympiad" {
		return s.listOlympiadResults(params)
	}
	if params.SourceType == "mock_test" {
		return s.listMockResults(params)
	}

	// Ikkala type'ni birlashtirish
	return s.listAllResults(params)
}

func (s *Service) listOlympiadResults(params ListParams) (map[string]interface{}, error) {
	attempts, total, err := s.repo.ListOlympiadAttempts(params)
	if err != nil {
		return nil, err
	}

	items := make([]PublicResultItem, len(attempts))
	for i := range attempts {
		items[i] = fromOlympiadAttempt(&attempts[i])
	}

	return paginatedResponse(items, total, params), nil
}

func (s *Service) listMockResults(params ListParams) (map[string]interface{}, error) {
	attempts, total, err := s.repo.ListMockAttempts(params)
	if err != nil {
		return nil, err
	}

	items := make([]PublicResultItem, len(attempts))
	for i := range attempts {
		items[i] = fromMockAttempt(&attempts[i])
	}

	return paginatedResponse(items, total, params), nil
}

func (s *Service) listAllResults(params ListParams) (map[string]interface{}, error) {
	// Ikkala turdan ham olamiz
	oAttempts, oTotal, err := s.repo.ListOlympiadAttempts(params)
	if err != nil {
		return nil, err
	}

	mAttempts, mTotal, err := s.repo.ListMockAttempts(params)
	if err != nil {
		return nil, err
	}

	var allItems []PublicResultItem
	for i := range oAttempts {
		allItems = append(allItems, fromOlympiadAttempt(&oAttempts[i]))
	}
	for i := range mAttempts {
		allItems = append(allItems, fromMockAttempt(&mAttempts[i]))
	}

	// Score bo'yicha sort
	sort.Slice(allItems, func(i, j int) bool {
		return allItems[i].Score > allItems[j].Score
	})

	total := oTotal + mTotal

	// Manual pagination for combined results
	offset := (params.Page - 1) * params.PageSize
	end := offset + params.PageSize
	if offset > len(allItems) {
		offset = len(allItems)
	}
	if end > len(allItems) {
		end = len(allItems)
	}

	return paginatedResponse(allItems[offset:end], total, params), nil
}

func paginatedResponse(items []PublicResultItem, total int64, params ListParams) map[string]interface{} {
	if items == nil {
		items = []PublicResultItem{}
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
	}
}
