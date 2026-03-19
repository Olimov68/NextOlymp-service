package verify

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

type VerifyResponse struct {
	CertificateNumber string  `json:"certificate_number"`
	VerificationCode  string  `json:"verification_code"`
	CertificateType   string  `json:"certificate_type"`
	Title             string  `json:"title"`
	FullName          string  `json:"full_name"`
	SubjectName       string  `json:"subject_name"`
	ClassName         string  `json:"class_name"`
	Score             float64 `json:"score"`
	ScaledScore       float64 `json:"scaled_score"`
	MaxScore          float64 `json:"max_score"`
	Percentage        float64 `json:"percentage"`
	Grade             string  `json:"grade"`
	Rank              *int    `json:"rank,omitempty"`
	Status            string  `json:"status"`
	IssuedAt          string  `json:"issued_at"`
	ValidUntil        string  `json:"valid_until,omitempty"`
	SourceType        string  `json:"source_type"`
}

// VerifyCertificate GET /api/v1/certificates/verify/:code
func (h *Handler) VerifyCertificate(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		code = c.Query("code")
	}
	if code == "" {
		response.Error(c, http.StatusBadRequest, "Tasdiqlash kodi talab qilinadi", nil)
		return
	}

	var cert models.Certificate
	err := h.db.Where("verification_code = ? OR certificate_number = ?", code, code).First(&cert).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(c, http.StatusNotFound, "Sertifikat topilmadi", nil)
			return
		}
		response.InternalError(c)
		return
	}

	resp := VerifyResponse{
		CertificateNumber: cert.CertificateNumber,
		VerificationCode:  cert.VerificationCode,
		CertificateType:   cert.CertificateType,
		Title:             cert.Title,
		FullName:          cert.FullName,
		SubjectName:       cert.SubjectName,
		ClassName:         cert.ClassName,
		Score:             cert.Score,
		ScaledScore:       cert.ScaledScore,
		MaxScore:          cert.MaxScore,
		Percentage:        cert.Percentage,
		Grade:             cert.Grade,
		Rank:              cert.Rank,
		Status:            cert.Status,
		IssuedAt:          cert.IssuedAt.Format("02.01.2006"),
		SourceType:        string(cert.SourceType),
	}

	if cert.ValidUntil != nil {
		resp.ValidUntil = cert.ValidUntil.Format("02.01.2006")
	}

	response.Success(c, http.StatusOK, "Sertifikat topildi", resp)
}
