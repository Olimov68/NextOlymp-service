package xp

import (
	"errors"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

// Service — DB bilan ishlovchi XP service'i.
type Service struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Service {
	return &Service{db: db}
}

// AwardResult — XP berilgandan keyingi yakuniy holat.
type AwardResult struct {
	XPAwarded    int            `json:"xp_awarded"`
	NewTotalXP   int64          `json:"new_total_xp"`
	OldLevel     int            `json:"old_level"`
	NewLevel     int            `json:"new_level"`
	LeveledUp    bool           `json:"leveled_up"`
	CurrentStreak int           `json:"current_streak"`
	Breakdown    AwardBreakdown `json:"breakdown"`
}

// AwardForTest — bitta yakunlangan urinish uchun XP beradi va profilni yangilaydi.
//
// Streak qoidasi:
//   - last_test_date == bugun  → streak o'zgarmaydi
//   - last_test_date == kecha  → streak += 1
//   - boshqa holatlar          → streak = 1
func (s *Service) AwardForTest(userID uint, in AttemptInput) (*AwardResult, error) {
	if userID == 0 {
		return nil, errors.New("xp: invalid user id")
	}

	var result *AwardResult
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var profile models.Profile
		if err := tx.Where("user_id = ?", userID).First(&profile).Error; err != nil {
			return err
		}

		// Streak hisoblash
		today := time.Now().Truncate(24 * time.Hour)
		yesterday := today.AddDate(0, 0, -1)
		newStreak := profile.CurrentStreak

		if profile.LastTestDate == nil {
			newStreak = 1
		} else {
			last := profile.LastTestDate.Truncate(24 * time.Hour)
			switch {
			case last.Equal(today):
				if newStreak < 1 {
					newStreak = 1
				}
			case last.Equal(yesterday):
				newStreak++
			default:
				newStreak = 1
			}
		}

		in.StreakDays = newStreak
		breakdown := Calculate(in)

		oldLevel := profile.Level
		if oldLevel < 1 {
			oldLevel = 1
		}
		newTotal := profile.TotalXP + int64(breakdown.Total)
		newLevel := CalculateLevel(newTotal)

		updates := map[string]interface{}{
			"total_xp":        newTotal,
			"level":           newLevel,
			"tests_completed": profile.TestsCompleted + 1,
			"current_streak":  newStreak,
			"last_test_date":  today,
		}
		if newStreak > profile.BestStreak {
			updates["best_streak"] = newStreak
		}

		if err := tx.Model(&models.Profile{}).
			Where("id = ?", profile.ID).
			Updates(updates).Error; err != nil {
			return err
		}

		result = &AwardResult{
			XPAwarded:     breakdown.Total,
			NewTotalXP:    newTotal,
			OldLevel:      oldLevel,
			NewLevel:      newLevel,
			LeveledUp:     newLevel > oldLevel,
			CurrentStreak: newStreak,
			Breakdown:     breakdown,
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return result, nil
}
