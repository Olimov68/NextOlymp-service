package balance

import (
	"fmt"
	"net/http"
	"os"
	"time"

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

// GetBalance — foydalanuvchi balansini olish
func (h *Handler) GetBalance(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)

	var bal models.Balance
	if err := h.db.Where("user_id = ?", userID).First(&bal).Error; err != nil {
		bal = models.Balance{UserID: userID, Amount: 0, Currency: "UZS"}
		h.db.Create(&bal)
	}

	response.Success(c, http.StatusOK, "Balans", gin.H{
		"balance":  bal.Amount,
		"currency": bal.Currency,
	})
}

// GetTransactions — tranzaksiyalar tarixi
func (h *Handler) GetTransactions(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	var total int64
	h.db.Model(&models.BalanceTransaction{}).Where("user_id = ?", userID).Count(&total)

	var transactions []models.BalanceTransaction
	offset := (page - 1) * limit
	h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&transactions)

	response.SuccessWithPagination(c, http.StatusOK, "Tranzaksiyalar", transactions, page, limit, total)
}

// TopUp — balans to'ldirish so'rovi (payment yaratish)
type TopUpRequest struct {
	Amount float64 `json:"amount" binding:"required,min=1000"`
}

func (h *Handler) TopUp(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)

	var req TopUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	payment := models.Payment{
		UserID:        userID,
		SourceType:    models.PaymentSourceType("topup"),
		SourceID:      0,
		Amount:        req.Amount,
		Currency:      "UZS",
		Status:        models.PaymentStatusPending,
		TransactionID: fmt.Sprintf("TOPUP-%d-%d", userID, time.Now().Unix()),
	}
	h.db.Create(&payment)

	// Build Payme checkout info
	merchantID := os.Getenv("PAYME_MERCHANT_ID")
	testMode := os.Getenv("PAYME_TEST_MODE") == "true"
	checkoutURL := "https://checkout.paycom.uz"
	if testMode {
		checkoutURL = "https://test.paycom.uz"
	}
	amountTiyin := int64(req.Amount * 100) // UZS -> tiyin

	response.Success(c, http.StatusCreated, "To'ldirish so'rovi yaratildi", gin.H{
		"payment_id":     payment.ID,
		"amount":         payment.Amount,
		"transaction_id": payment.TransactionID,
		"status":         payment.Status,
		"checkout_url":   checkoutURL,
		"payme": gin.H{
			"merchant_id": merchantID,
			"amount":      amountTiyin,
			"order_id":    payment.ID,
			"checkout_url": checkoutURL,
		},
	})
}
