package assessment

import (
	"math"
)

// RaschInput — Rasch hisoblash uchun kirish ma'lumotlari
type RaschInput struct {
	// Userning har bir savolga javoblari (true = to'g'ri, false = noto'g'ri)
	Responses []bool
	// Har bir savolning qiyinchilik parametri (logit scale)
	ItemDifficulties []float64
}

// RaschResult — Rasch hisoblash natijasi
type RaschResult struct {
	Theta      float64                `json:"theta"`       // Rasch ability estimate
	Mu         float64                `json:"mu"`          // O'rtacha theta (cohort)
	Sigma      float64                `json:"sigma"`       // Standart tafovut
	ZScore     float64                `json:"z_score"`     // Z = (theta - mu) / sigma
	TScore     float64                `json:"t_score"`     // T = 50 + 10*Z
	GradeLabel string                 `json:"grade_label"` // A+, A, B+, B, C+, C, C dan quyi
	Meta       map[string]interface{} `json:"meta"`        // Audit trail
}

// CalculateTheta — Rasch modeli asosida theta (ability) ni hisoblaydi.
//
// Bu approximate Rasch estimation. Haqiqiy IRT calibration uchun
// Newton-Raphson yoki JMLE/CMLE kerak. Hozircha log-odds
// approximation ishlatiladi — future-ready structure.
//
// Formula: theta = ln(p / (1-p)) + mean(item_difficulties)
// Bu yerda p = correct_proportion
func CalculateTheta(input RaschInput) float64 {
	if len(input.Responses) == 0 {
		return 0
	}

	correctCount := 0
	for _, r := range input.Responses {
		if r {
			correctCount++
		}
	}

	totalItems := len(input.Responses)
	proportion := float64(correctCount) / float64(totalItems)

	// Edge cases: 0% yoki 100% bo'lsa log(0) muammo
	// Rasch konvensiyasi: 0.25 / (N+0.5) yoki (N-0.25)/(N+0.5) bilan cheklash
	if proportion <= 0 {
		proportion = 0.25 / (float64(totalItems) + 0.5)
	}
	if proportion >= 1.0 {
		proportion = (float64(totalItems) - 0.25) / (float64(totalItems) + 0.5)
	}

	// Log-odds (logit) approximation
	logit := math.Log(proportion / (1 - proportion))

	// Item difficulty mean bilan adjust qilish
	meanDifficulty := 0.0
	if len(input.ItemDifficulties) > 0 {
		sum := 0.0
		for _, d := range input.ItemDifficulties {
			sum += d
		}
		meanDifficulty = sum / float64(len(input.ItemDifficulties))
	}

	theta := logit + meanDifficulty
	return theta
}

// CalculateZScore — Z = (theta - mu) / sigma
func CalculateZScore(theta, mu, sigma float64) float64 {
	if sigma == 0 {
		return 0 // fallback: divide by zero himoya
	}
	return (theta - mu) / sigma
}

// CalculateTScore — T = 50 + 10 * Z
func CalculateTScore(zScore float64) float64 {
	return 50 + 10*zScore
}

// CalculateMuSigma — cohort (shu mock test) bo'yicha mu va sigma hisoblash
func CalculateMuSigma(thetas []float64) (mu float64, sigma float64) {
	n := len(thetas)
	if n == 0 {
		return 0, 0
	}

	// Mean
	sum := 0.0
	for _, t := range thetas {
		sum += t
	}
	mu = sum / float64(n)

	// Standard deviation
	if n < 2 {
		// Faqat 1 ta natija bo'lsa sigma = 0
		return mu, 0
	}

	sumSq := 0.0
	for _, t := range thetas {
		diff := t - mu
		sumSq += diff * diff
	}
	sigma = math.Sqrt(sumSq / float64(n))

	return mu, sigma
}

// FullRaschPipeline — to'liq Rasch hisoblash pipeline
func FullRaschPipeline(input RaschInput, cohortThetas []float64) RaschResult {
	meta := map[string]interface{}{
		"formula_version":     "rasch_logit_approx_v1",
		"total_items":         len(input.Responses),
		"cohort_size":         len(cohortThetas),
		"is_approximation":    true,
		"approximation_notes": "Log-odds approximation. Replace with Newton-Raphson IRT for production calibration.",
	}

	// 1. Theta hisoblash
	theta := CalculateTheta(input)

	// 2. Cohort thetalaridan mu va sigma
	// Hozirgi userning theta sini ham cohortga qo'shish
	allThetas := append(cohortThetas, theta)
	mu, sigma := CalculateMuSigma(allThetas)

	// 3. Z va T score
	var zScore, tScore float64
	usedFallback := false

	if sigma == 0 {
		// Faqat bitta natija yoki barcha natijalar bir xil
		zScore = 0
		tScore = 50
		usedFallback = true
		meta["fallback_reason"] = "sigma=0, single result or identical scores"
	} else {
		zScore = CalculateZScore(theta, mu, sigma)
		tScore = CalculateTScore(zScore)
	}

	meta["mu"] = math.Round(mu*1000) / 1000
	meta["sigma"] = math.Round(sigma*1000) / 1000
	meta["fallback_used"] = usedFallback

	// 4. Grade label
	gradeLabel := GetGradeLabel(tScore)

	return RaschResult{
		Theta:      math.Round(theta*1000) / 1000,
		Mu:         math.Round(mu*1000) / 1000,
		Sigma:      math.Round(sigma*1000) / 1000,
		ZScore:     math.Round(zScore*1000) / 1000,
		TScore:     math.Round(tScore*10) / 10,
		GradeLabel: gradeLabel,
		Meta:       meta,
	}
}
