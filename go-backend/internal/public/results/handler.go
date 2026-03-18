package publicresults

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List — public natijalar ro'yxati
// GET /api/v1/public/results?source_type=olympiad&source_id=3&subject=matematika&search=asilbek&page=1
func (h *Handler) List(c *gin.Context) {
	var params ListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	result, err := h.service.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Public results", result)
}

// GetBySource — ma'lum source uchun natijalar
// GET /api/v1/public/results/source/:source_type/:source_id
func (h *Handler) GetBySource(c *gin.Context) {
	sourceType := c.Param("source_type")
	if sourceType != "olympiad" && sourceType != "mock_test" {
		response.Error(c, http.StatusBadRequest, "Invalid source_type. Use: olympiad or mock_test", nil)
		return
	}

	sourceID, err := strconv.ParseUint(c.Param("source_id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid source_id", nil)
		return
	}

	var params ListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	params.SourceType = sourceType
	params.SourceID = uint(sourceID)

	result, err := h.service.List(params)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, http.StatusOK, "Public results", result)
}
