package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, status int, message string, errors ...interface{}) {
	var errs interface{}
	if len(errors) > 0 {
		errs = errors[0]
	}
	c.JSON(status, Response{
		Success: false,
		Message: message,
		Errors:  errs,
	})
}

func ValidationError(c *gin.Context, errors interface{}) {
	Error(c, http.StatusUnprocessableEntity, "Ma'lumotlar noto'g'ri kiritilgan", errors)
}

func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Unauthorized"
	}
	Error(c, http.StatusUnauthorized, message, nil)
}

func Forbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Forbidden"
	}
	Error(c, http.StatusForbidden, message, nil)
}

func NotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Not found"
	}
	Error(c, http.StatusNotFound, message, nil)
}

func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "Internal server error", nil)
}

// SuccessWithPagination — pagination bilan javob
func SuccessWithPagination(c *gin.Context, status int, message string, data interface{}, page, limit int, total int64) {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}
