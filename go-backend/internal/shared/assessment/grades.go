package assessment

// GradeThreshold — daraja chegarasi
type GradeThreshold struct {
	MinTScore float64
	Label     string
}

// DefaultGradeThresholds — PDF bo'yicha standart daraja chegaralari
// T = 50 + 10Z shkalasida
var DefaultGradeThresholds = []GradeThreshold{
	{MinTScore: 70, Label: "A+"},
	{MinTScore: 65, Label: "A"},
	{MinTScore: 60, Label: "B+"},
	{MinTScore: 55, Label: "B"},
	{MinTScore: 50, Label: "C+"},
	{MinTScore: 46, Label: "C"},
	// 46 dan past = "C dan quyi"
}

// GetGradeLabel — T score asosida daraja aniqlash
func GetGradeLabel(tScore float64) string {
	for _, gt := range DefaultGradeThresholds {
		if tScore >= gt.MinTScore {
			return gt.Label
		}
	}
	return "C dan quyi"
}

// GetGradeLabelWithCustomThresholds — maxsus thresholdlar bilan
func GetGradeLabelWithCustomThresholds(tScore float64, thresholds []GradeThreshold) string {
	for _, gt := range thresholds {
		if tScore >= gt.MinTScore {
			return gt.Label
		}
	}
	return "C dan quyi"
}
