package sacertificates

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/certgen"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo      *Repository
	db        *gorm.DB
	certGen   *certgen.CertGenerator
	uploadDir string
}

func NewHandler(db *gorm.DB, cg *certgen.CertGenerator, uploadDir string) *Handler {
	return &Handler{
		repo:      NewRepository(db),
		db:        db,
		certGen:   cg,
		uploadDir: uploadDir,
	}
}

// List GET /api/v1/superadmin/certificates
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	c.ShouldBindQuery(&params)
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := h.repo.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	items := make([]CertificateResponse, len(list))
	for i, cert := range list {
		items[i] = ToResponse(&cert)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Certificates", items, params.Page, params.PageSize, total)
}

// GetByID GET /api/v1/superadmin/certificates/:id
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}
	cert, err := h.repo.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Certificate not found")
			return
		}
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusOK, "Certificate", ToResponse(cert))
}

// Create POST /api/v1/superadmin/certificates
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	// Auto-generate certificate number and verification code
	certNumber := h.certGen.GenerateCertificateNumber(req.SubjectName)
	verifyCode := h.certGen.GenerateVerificationCode()

	// Mock Rasch uchun grade hisoblash
	grade := req.Grade
	if req.CertificateType == models.CertTypeMockRasch && grade == "" {
		grade = models.CalculateGrade(req.ScaledScore)
	}

	cert := &models.Certificate{
		UserID:            req.UserID,
		TemplateID:        req.TemplateID,
		CertificateType:   req.CertificateType,
		SourceType:        models.CertificateSourceType(req.SourceType),
		SourceID:          req.SourceID,
		CertificateNumber: certNumber,
		VerificationCode:  verifyCode,
		Title:             req.Title,
		FullName:          req.FullName,
		ClassName:         req.ClassName,
		SubjectName:       req.SubjectName,
		Score:             req.Score,
		ScaledScore:       req.ScaledScore,
		MaxScore:          req.MaxScore,
		Percentage:        req.Percentage,
		Grade:             grade,
		Rank:              req.Rank,
		Status:            models.CertStatusActive,
		IssuedAt:          time.Now(),
	}

	// ValidUntil — mock_rasch uchun 3 yil, olympiad uchun cheksiz
	if req.ValidYears > 0 {
		validUntil := time.Now().AddDate(req.ValidYears, 0, 0)
		cert.ValidUntil = &validUntil
	} else if req.CertificateType == models.CertTypeMockRasch {
		validUntil := time.Now().AddDate(3, 0, 0) // default 3 yil
		cert.ValidUntil = &validUntil
	}

	if err := h.repo.Create(cert); err != nil {
		response.Error(c, http.StatusInternalServerError, "Sertifikat yaratishda xato", nil)
		return
	}

	// PDF generatsiya (agar template tanlangan bo'lsa)
	if req.TemplateID != nil {
		var tmpl models.CertificateTemplate
		if h.db.First(&tmpl, *req.TemplateID).Error == nil {
			pdfURL, err := h.certGen.Generate(cert, &tmpl)
			if err == nil {
				h.repo.Update(cert.ID, map[string]interface{}{"pdf_url": pdfURL})
				cert.PDFURL = pdfURL
			}
		}
	}

	response.Success(c, http.StatusCreated, "Sertifikat yaratildi", ToResponse(cert))
}

// Update PUT /api/v1/superadmin/certificates/:id
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	if _, err := h.repo.GetByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "Certificate not found")
			return
		}
		response.InternalError(c)
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	fields := map[string]interface{}{}
	if req.Title != nil {
		fields["title"] = *req.Title
	}
	if req.FileURL != nil {
		fields["file_url"] = *req.FileURL
	}

	if err := h.repo.Update(uint(id), fields); err != nil {
		response.InternalError(c)
		return
	}

	updated, _ := h.repo.GetByID(uint(id))
	response.Success(c, http.StatusOK, "Certificate updated", ToResponse(updated))
}

// Regenerate POST /api/v1/superadmin/certificates/:id/regenerate
func (h *Handler) Regenerate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	cert, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Sertifikat topilmadi")
		return
	}

	if cert.TemplateID == nil {
		response.Error(c, http.StatusBadRequest, "Template tanlanmagan", nil)
		return
	}

	var tmpl models.CertificateTemplate
	if h.db.First(&tmpl, *cert.TemplateID).Error != nil {
		response.NotFound(c, "Template topilmadi")
		return
	}

	// Eski PDFni o'chirish
	if cert.PDFURL != "" {
		oldPath := filepath.Join(h.uploadDir, filepath.Base(cert.PDFURL))
		os.Remove(oldPath)
	}

	pdfURL, err := h.certGen.Generate(cert, &tmpl)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PDF yaratishda xato: "+err.Error(), nil)
		return
	}

	h.repo.Update(cert.ID, map[string]interface{}{"pdf_url": pdfURL})
	cert.PDFURL = pdfURL

	response.Success(c, http.StatusOK, "Sertifikat qayta yaratildi", ToResponse(cert))
}

// Revoke POST /api/v1/superadmin/certificates/:id/revoke
func (h *Handler) Revoke(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	cert, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Sertifikat topilmadi")
		return
	}

	if cert.Status == models.CertStatusRevoked {
		response.Error(c, http.StatusBadRequest, "Sertifikat allaqachon bekor qilingan", nil)
		return
	}

	now := time.Now()
	h.repo.Update(cert.ID, map[string]interface{}{
		"status":     models.CertStatusRevoked,
		"revoked_at": now,
	})

	cert.Status = models.CertStatusRevoked
	cert.RevokedAt = &now

	response.Success(c, http.StatusOK, "Sertifikat bekor qilindi", ToResponse(cert))
}

// Download GET /api/v1/superadmin/certificates/:id/download
func (h *Handler) Download(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID", nil)
		return
	}

	cert, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "Sertifikat topilmadi")
		return
	}

	pdfPath := cert.PDFURL
	if pdfPath == "" {
		pdfPath = cert.FileURL
	}
	if pdfPath == "" {
		response.Error(c, http.StatusNotFound, "PDF fayl topilmadi", nil)
		return
	}

	// /uploads/certificates/xxx.pdf -> uploadDir/certificates/xxx.pdf
	fullPath := filepath.Join(h.uploadDir, filepath.Clean(pdfPath[len("/uploads"):]))
	if _, err := os.Stat(fullPath); err != nil {
		response.Error(c, http.StatusNotFound, "PDF fayl mavjud emas", nil)
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+cert.CertificateNumber+".pdf")
	c.File(fullPath)
}
