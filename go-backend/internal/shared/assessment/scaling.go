package assessment

import "math"

// ScalingFormulaType — proporsional ball hisoblash formulasi turlari
const (
	ScalingNone      = "none"
	ScalingProp93_65 = "prop_93_65" // Ball * 93 / 65 — mutaxassislik fanlari bloki 1-fan
	ScalingProp63_65 = "prop_63_65" // Ball * 63 / 65 — mutaxassislik fanlari bloki 2-fan
)

// ValidScalingFormulas — validation uchun ruxsat etilgan formulalar
var ValidScalingFormulas = map[string]bool{
	ScalingNone:      true,
	ScalingProp93_65: true,
	ScalingProp63_65: true,
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
