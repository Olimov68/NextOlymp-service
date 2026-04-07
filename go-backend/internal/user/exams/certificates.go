package exams

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

// generateCertNumber — auto generated certificate number (CERT-YYYY-XXXXXX)
func generateCertNumber(prefix string) string {
	if prefix == "" {
		prefix = "NEXT"
	}
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%d-%s", strings.ToUpper(prefix), time.Now().Year(), strings.ToUpper(hex.EncodeToString(b)))
}

// generateVerifyCode — short verification token
func generateVerifyCode() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return strings.ToUpper(hex.EncodeToString(b))
}

// alreadyHasCertificate — bitta source uchun foydalanuvchi sertifikati allaqachon mavjudligini tekshiradi
func (h *Handler) alreadyHasCertificate(userID uint, sourceType models.CertificateSourceType, sourceID uint) bool {
	var count int64
	h.db.Model(&models.Certificate{}).
		Where("user_id = ? AND source_type = ? AND source_id = ? AND status = ?",
			userID, sourceType, sourceID, models.CertStatusActive).
		Count(&count)
	return count > 0
}

// fetchUserDisplayName — sertifikat uchun "FullName" maydoniga to'liq ism
func (h *Handler) fetchUserDisplayName(userID uint) (fullName, className string) {
	var profile models.Profile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err == nil {
		fullName = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
		if profile.Grade > 0 {
			className = fmt.Sprintf("%d-sinf", profile.Grade)
		}
	}
	if fullName == "" {
		var u models.User
		if err := h.db.First(&u, userID).Error; err == nil {
			fullName = u.FullName
			if fullName == "" {
				fullName = u.Username
			}
		}
	}
	return
}

// issueCertificateIfEligible — mock test uchun sertifikat berish
//
// Mavjudligi:
//   - mockTest.GiveCertificate == true bo'lishi kerak (caller tekshiradi)
//   - foydalanuvchi attempt'i completed/timed_out (caller tekshiradi)
//   - foydalanuvchi shu mock test bo'yicha allaqachon sertifikat olmagan bo'lishi kerak
//
// Threshold (kim sertifikatga loyiq):
//   - Rasch tizimi: T-ball ≥ 46 (mavjud `IsEligibleForCertificate`)
//   - Oddiy tizim: percentage ≥ 60%
func (h *Handler) issueCertificateIfEligible(userID uint, mt *models.MockTest, attempt *models.MockAttempt) map[string]interface{} {
	if h.alreadyHasCertificate(userID, models.CertSourceMockTest, mt.ID) {
		return nil
	}

	// Eligibility tekshiruvi
	var grade string
	certType := models.CertTypeMockRasch
	scaledScore := 0.0

	if mt.ScoringType == "rasch" && attempt.TScore != nil {
		if !models.IsEligibleForCertificate(*attempt.TScore) {
			return nil
		}
		scaledScore = *attempt.TScore
		grade = models.CalculateGrade(*attempt.TScore)
	} else {
		// Oddiy tizimda 60% va undan ko'p
		if attempt.Percentage < 60 {
			return nil
		}
		scaledScore = attempt.Percentage
		certType = models.CertTypeMockRasch // (ko'rinish uchun mock_rasch)
		switch {
		case attempt.Percentage >= 90:
			grade = "A+"
		case attempt.Percentage >= 80:
			grade = "A"
		case attempt.Percentage >= 70:
			grade = "B"
		default:
			grade = "C"
		}
	}

	fullName, className := h.fetchUserDisplayName(userID)

	cert := models.Certificate{
		UserID:            userID,
		CertificateType:   certType,
		SourceType:        models.CertSourceMockTest,
		SourceID:          mt.ID,
		CertificateNumber: generateCertNumber("MT"),
		VerificationCode:  generateVerifyCode(),
		Title:             mt.Title,
		FullName:          fullName,
		ClassName:         className,
		SubjectName:       mt.Subject,
		Score:             attempt.Score,
		ScaledScore:       scaledScore,
		MaxScore:          attempt.MaxScore,
		Percentage:        attempt.Percentage,
		Grade:             grade,
		Status:            models.CertStatusActive,
		IssuedAt:          time.Now(),
	}
	// Mock test sertifikatlari uchun 3 yillik amal qilish muddati
	validUntil := time.Now().AddDate(3, 0, 0)
	cert.ValidUntil = &validUntil

	if err := h.db.Create(&cert).Error; err != nil {
		return nil
	}

	return map[string]interface{}{
		"id":                cert.ID,
		"certificate_number": cert.CertificateNumber,
		"verification_code":  cert.VerificationCode,
		"grade":              cert.Grade,
		"issued_at":          cert.IssuedAt,
	}
}

// issueCertificateForOlympiad — olimpiada uchun sertifikat berish
//
// Threshold:
//   - olympiad.MinScoreForCertificate > 0 bo'lsa, attempt.Score >= MinScoreForCertificate
//   - aks holda percentage >= 60%
func (h *Handler) issueCertificateForOlympiad(userID uint, ol *models.Olympiad, attempt *models.OlympiadAttempt) map[string]interface{} {
	if h.alreadyHasCertificate(userID, models.CertSourceOlympiad, ol.ID) {
		return nil
	}

	// Eligibility tekshiruvi
	if ol.MinScoreForCertificate > 0 {
		if int(attempt.Score) < ol.MinScoreForCertificate {
			return nil
		}
	} else if attempt.Percentage < 60 {
		return nil
	}

	fullName, className := h.fetchUserDisplayName(userID)

	var grade string
	switch {
	case attempt.Percentage >= 90:
		grade = "A+"
	case attempt.Percentage >= 80:
		grade = "A"
	case attempt.Percentage >= 70:
		grade = "B"
	default:
		grade = "C"
	}

	cert := models.Certificate{
		UserID:            userID,
		CertificateType:   models.CertTypeOlympiad,
		SourceType:        models.CertSourceOlympiad,
		SourceID:          ol.ID,
		CertificateNumber: generateCertNumber("OL"),
		VerificationCode:  generateVerifyCode(),
		Title:             ol.Title,
		FullName:          fullName,
		ClassName:         className,
		SubjectName:       ol.Subject,
		Score:             attempt.Score,
		ScaledScore:       attempt.Score,
		MaxScore:          attempt.MaxScore,
		Percentage:        attempt.Percentage,
		Grade:             grade,
		Status:            models.CertStatusActive,
		IssuedAt:          time.Now(),
	}

	if err := h.db.Create(&cert).Error; err != nil {
		return nil
	}

	return map[string]interface{}{
		"id":                cert.ID,
		"certificate_number": cert.CertificateNumber,
		"verification_code":  cert.VerificationCode,
		"grade":              cert.Grade,
		"issued_at":          cert.IssuedAt,
	}
}
