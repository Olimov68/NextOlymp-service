package sacertificates

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{repo: NewRepository(db)}
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

	cert := &models.Certificate{
		UserID:            req.UserID,
		SourceType:        models.CertificateSourceType(req.SourceType),
		SourceID:          req.SourceID,
		CertificateNumber: req.CertificateNumber,
		Title:             req.Title,
		FileURL:           req.FileURL,
		IssuedAt:          time.Now(),
		VerificationCode:  generateVerificationCode(),
	}

	if err := h.repo.Create(cert); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, http.StatusCreated, "Certificate created", ToResponse(cert))
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

func generateVerificationCode() string {
	b := make([]byte, 8)
	rand.Read(b)
	return fmt.Sprintf("CERT-%X", b)
}
