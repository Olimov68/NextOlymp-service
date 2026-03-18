package publicresults

import (
	"fmt"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListParams struct {
	SourceType string `form:"source_type"` // olympiad | mock_test
	SourceID   uint   `form:"source_id"`
	Subject    string `form:"subject"`
	Search     string `form:"search"` // display name bo'yicha qidirish
	Page       int    `form:"page,default=1"`
	PageSize   int    `form:"page_size,default=20"`
}

type PublicResultItem struct {
	ID                     uint      `json:"id"`
	SourceType             string    `json:"source_type"`
	SourceID               uint      `json:"source_id"`
	SourceTitle            string    `json:"source_title"`
	ParticipantDisplayName string    `json:"participant_display_name"`
	Score                  float64   `json:"score"`
	MaxScore               float64   `json:"max_score"`
	Percentage             float64   `json:"percentage"`
	GradeLabel             string    `json:"grade_label,omitempty"`
	Rank                   int       `json:"rank,omitempty"`
	CreatedAt              time.Time `json:"created_at"`
}

// makeDisplayName — privacy-safe display name yaratish
// "Asilbek O." formatida
func makeDisplayName(user *models.User) string {
	if user == nil {
		return "Foydalanuvchi"
	}

	if user.Profile != nil && user.Profile.FirstName != "" && user.Profile.LastName != "" {
		lastInitial := string([]rune(user.Profile.LastName)[0])
		return fmt.Sprintf("%s %s.", user.Profile.FirstName, lastInitial)
	}

	// Profile yo'q bo'lsa username'dan foydalanamiz
	username := user.Username
	if len(username) > 3 {
		return username[:3] + "***"
	}
	return username + "***"
}

func fromOlympiadAttempt(a *models.OlympiadAttempt) PublicResultItem {
	sourceTitle := ""
	if a.Olympiad != nil {
		sourceTitle = a.Olympiad.Title
	}

	return PublicResultItem{
		ID:                     a.ID,
		SourceType:             "olympiad",
		SourceID:               a.OlympiadID,
		SourceTitle:            sourceTitle,
		ParticipantDisplayName: makeDisplayName(a.User),
		Score:                  a.Score,
		MaxScore:               a.MaxScore,
		Percentage:             a.Percentage,
		Rank:                   a.Rank,
		CreatedAt:              a.CreatedAt,
	}
}

func fromMockAttempt(a *models.MockAttempt) PublicResultItem {
	sourceTitle := ""
	if a.MockTest != nil {
		sourceTitle = a.MockTest.Title
	}

	return PublicResultItem{
		ID:                     a.ID,
		SourceType:             "mock_test",
		SourceID:               a.MockTestID,
		SourceTitle:            sourceTitle,
		ParticipantDisplayName: makeDisplayName(a.User),
		Score:                  a.Score,
		MaxScore:               a.MaxScore,
		Percentage:             a.Percentage,
		GradeLabel:             a.GradeLabel,
		CreatedAt:              a.CreatedAt,
	}
}
