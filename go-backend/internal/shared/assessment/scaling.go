package assessment

import "math"

// ScalingFormulaType — proporsional ball hisoblash formulasi turlari
const (
	ScalingNone      = "none"
	ScalingProp93_65 = "prop_93_65" // Ball * 93 / 65 — mutaxassislik fanlari bloki 1-fan (max 93)
	ScalingProp63_65 = "prop_63_65" // Ball * 63 / 65 — mutaxassislik fanlari bloki 2-fan (max 63)
	ScalingLang75    = "lang_75"    // Til fanlari uchun 75 ballik shkala (lookup table)
)

// ValidScalingFormulas — validation uchun ruxsat etilgan formulalar
var ValidScalingFormulas = map[string]bool{
	ScalingNone:      true,
	ScalingProp93_65: true,
	ScalingProp63_65: true,
	ScalingLang75:    true,
}

// lang75Lookup — 24 ballik mezondan 75 ballik shkalaga o'tkazish
// PDF dagi til fanlari yozma ish konvertatsiya jadvali asosida.
// Kalit: yozma ish bahosi (0..24, 0.5 qadamda), qiymat: 75 ballik
var lang75Lookup = map[float64]float64{
	24:   75, 23.5: 74, 23: 73, 22.5: 72, 22: 71, 21.5: 70,
	21:   69, 20.5: 68, 20: 67, 19.5: 66, 19: 65, 18.5: 64,
	18:   63, 17.5: 62, 17: 61, 16.5: 60, 16: 59, 15.5: 58,
	15:   57, 14.5: 56, 14: 55, 13.5: 54, 13: 53, 12.5: 52,
	12:   51, 11.5: 50, 11: 49, 10.5: 48, 10: 47, 9.5: 46,
	9:    45, 8.5: 44, 8: 43, 7.5: 42, 7: 41, 6.5: 40,
	6:    39, 5.5: 38, 5: 37, 4.5: 36, 4: 35, 3.5: 34,
	3:    33, 2.5: 32, 2: 31, 1.5: 30, 1: 29, 0.5: 28,
	0:    0,
}

// ConvertWritingTo75Scale — yozma ish bahosini (0..24) 75 ballik shkalaga o'tkazish.
// PDF dagi til fanlari uchun mezon jadvali bo'yicha.
// Agar aniq qiymat topilmasa, eng yaqin pastki qiymatga to'g'rilanadi.
func ConvertWritingTo75Scale(writingScore float64) float64 {
	if writingScore < 0 {
		return 0
	}
	if writingScore >= 24 {
		return 75
	}
	// 0.5 ga yaxlit
	rounded := math.Floor(writingScore*2) / 2
	if v, ok := lang75Lookup[rounded]; ok {
		return v
	}
	return 0
}

// CombineLanguageScore — til fanlari uchun yakuniy ball:
// (test qismi 75 shkalada + yozma ish 75 shkalada) / 2
//
// testT75 — test qismidan olingan T-score yoki shkala bo'yicha 75 ballik qiymat
// writingScore — yozma ishning 24 ballik bahosi (ekspertlar o'rta arifmetigi)
func CombineLanguageScore(testT75, writingScore float64) float64 {
	writing75 := ConvertWritingTo75Scale(writingScore)
	return math.Round((testT75+writing75)/2*10) / 10
}

// IsValidScalingFormula — scaling formula type validatsiyasi
func IsValidScalingFormula(formulaType string) bool {
	if formulaType == "" {
		return true // default: none
	}
	return ValidScalingFormulas[formulaType]
}

// ApplyScaling — T score yoki mapped score ga proporsional scaling qo'llash
//
// PDF bo'yicha:
// - prop_93_65: Ball * 93 / 65 (1-fan maksimal ball = 93, A daraja uchun minimal = 65)
// - prop_63_65: Ball * 63 / 65 (2-fan maksimal ball = 63, A daraja uchun minimal = 65)
// - lang_75:    T score'ni 75 shkalaga proporsional o'tkazish (T*75/65 — 65 = A daraja minimumi)
//
// Bu yerda "Ball" — bu Rasch T score asosida aniqlangan proporsional qiymat
func ApplyScaling(tScore float64, formulaType string) *float64 {
	switch formulaType {
	case ScalingProp93_65:
		scaled := math.Round(tScore*93/65*100) / 100
		return &scaled
	case ScalingProp63_65:
		scaled := math.Round(tScore*63/65*100) / 100
		return &scaled
	case ScalingLang75:
		// Til fanlari uchun T score'dan 75 shkalaga proporsional
		// (yozma ish konvertatsiyasi alohida ConvertWritingTo75Scale orqali bo'ladi)
		scaled := math.Round(tScore*75/65*100) / 100
		return &scaled
	case ScalingNone, "":
		return nil // scaling qo'llanilmadi
	default:
		return nil
	}
}

// ValidScoringTypes — scoring_type uchun ruxsat etilgan qiymatlar
var ValidScoringTypes = map[string]bool{
	"simple": true,
	"rasch":  true,
}

// IsValidScoringType — scoring_type validatsiyasi
func IsValidScoringType(scoringType string) bool {
	if scoringType == "" {
		return true // default: simple
	}
	return ValidScoringTypes[scoringType]
}
