// Package xp implements the per-test XP/level/streak award system.
//
// Har test uchun foydalanuvchi quyidagicha XP oladi:
//
//	base         = 10
//	per_correct  = correct * 2
//	percent_bonus= 90% va undan ko'p -> 50, 80%+ -> 30, 70%+ -> 15, 60%+ -> 5
//	streak_bonus = min(streakDays * 5, 50)
//	subtotal     = base + per_correct + percent_bonus + streak_bonus
//	total        = isOlympiad ? subtotal * 2 : subtotal
//
// Level formulasi: har 100 XP — 1 level. level = (xp / 100) + 1.
package xp

// AttemptInput — bitta yakunlangan urinish bo'yicha kirish ma'lumotlari.
type AttemptInput struct {
	Correct    int
	MaxScore   int
	Percentage float64
	IsOlympiad bool
	StreakDays int // joriy streak (kun) — service tomonidan to'ldiriladi
}

// AwardBreakdown — XP qanday hisoblanganini ko'rsatuvchi taxlil (audit/UI uchun).
type AwardBreakdown struct {
	Base         int     `json:"base"`
	PerCorrect   int     `json:"per_correct"`
	PercentBonus int     `json:"percent_bonus"`
	StreakBonus  int     `json:"streak_bonus"`
	OlympiadMul  float64 `json:"olympiad_mul"`
	Total        int     `json:"total"`
}

// Calculate — sof funksiya. AttemptInput'dan AwardBreakdown qaytaradi.
func Calculate(in AttemptInput) AwardBreakdown {
	base := 10
	perCorrect := in.Correct * 2

	percentBonus := 0
	switch {
	case in.Percentage >= 90:
		percentBonus = 50
	case in.Percentage >= 80:
		percentBonus = 30
	case in.Percentage >= 70:
		percentBonus = 15
	case in.Percentage >= 60:
		percentBonus = 5
	}

	streakBonus := in.StreakDays * 5
	if streakBonus > 50 {
		streakBonus = 50
	}
	if streakBonus < 0 {
		streakBonus = 0
	}

	subtotal := base + perCorrect + percentBonus + streakBonus

	mul := 1.0
	if in.IsOlympiad {
		mul = 2.0
	}
	total := int(float64(subtotal) * mul)

	return AwardBreakdown{
		Base:         base,
		PerCorrect:   perCorrect,
		PercentBonus: percentBonus,
		StreakBonus:  streakBonus,
		OlympiadMul:  mul,
		Total:        total,
	}
}

// CalculateLevel — jami XP bo'yicha levelni hisoblaydi.
// Level 1 = 0..99 XP, Level 2 = 100..199, ...
func CalculateLevel(totalXP int64) int {
	if totalXP < 0 {
		return 1
	}
	return int(totalXP/100) + 1
}

// LevelInfo — frontend progress bar uchun.
type LevelInfo struct {
	Level         int     `json:"level"`
	CurrentXP     int64   `json:"current_xp"`      // shu level ichidagi XP (0..99)
	XPForNext     int64   `json:"xp_for_next"`     // keyingi levelgacha qancha kerak
	NextLevelAt   int64   `json:"next_level_at"`   // keyingi level boshlanadigan jami XP
	Progress      float64 `json:"progress"`        // 0..1
}

// CalculateLevelInfo — joriy level haqida to'liq ma'lumot.
func CalculateLevelInfo(totalXP int64) LevelInfo {
	if totalXP < 0 {
		totalXP = 0
	}
	level := CalculateLevel(totalXP)
	currentLevelStart := int64(level-1) * 100
	nextLevelStart := int64(level) * 100
	currentXP := totalXP - currentLevelStart
	xpForNext := nextLevelStart - totalXP
	return LevelInfo{
		Level:       level,
		CurrentXP:   currentXP,
		XPForNext:   xpForNext,
		NextLevelAt: nextLevelStart,
		Progress:    float64(currentXP) / 100.0,
	}
}
