package models

import "time"

type PromoCodeStatus string

const (
	PromoCodeStatusActive   PromoCodeStatus = "active"
	PromoCodeStatusInactive PromoCodeStatus = "inactive"
	PromoCodeStatusExpired  PromoCodeStatus = "expired"
)

// PromoCode — chegirma promo kodlari
type PromoCode struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	Code            string          `gorm:"size:50;uniqueIndex;not null" json:"code"`
	Description     string          `gorm:"size:500" json:"description"`
	DiscountType    string          `gorm:"size:20;default:percent;not null" json:"discount_type"` // percent | fixed
	DiscountPercent float64         `gorm:"not null;default:0" json:"discount_percent"`            // Foizli chegirma (0-100)
	DiscountFixed   float64         `gorm:"not null;default:0" json:"discount_fixed"`              // Summali chegirma (UZS)
	MaxUsageCount   int             `gorm:"default:0" json:"max_usage_count"`                      // 0 = cheksiz
	UsedCount       int             `gorm:"default:0" json:"used_count"`
	PerUserLimit    int             `gorm:"default:1" json:"per_user_limit"`                       // Har bir user necha marta ishlata oladi
	MinAmount       float64         `gorm:"default:0" json:"min_amount"`                           // Minimum to'lov summasi
	MaxDiscount     *float64        `json:"max_discount"`                                          // Maksimum chegirma summasi (faqat percent uchun)
	ValidFrom       *time.Time      `json:"valid_from"`
	ValidUntil      *time.Time      `json:"valid_until"`
	SourceType      string          `gorm:"size:30" json:"source_type"`                            // olympiad | mock_test | all (bo'sh = all)
	Status          PromoCodeStatus `gorm:"size:20;default:active;not null;index" json:"status"`
	CreatedByID     *uint           `json:"created_by_id"`
	CreatedAt       time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	CreatedBy *StaffUser       `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	Usages    []PromoCodeUsage `gorm:"foreignKey:PromoCodeID" json:"usages,omitempty"`
}

// PromoCodeUsage — promo kod ishlatilgan tarix
type PromoCodeUsage struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	PromoCodeID     uint      `gorm:"not null;index" json:"promo_code_id"`
	UserID          uint      `gorm:"not null;index" json:"user_id"`
	PaymentID       *uint     `json:"payment_id"`
	OriginalAmount  float64   `gorm:"not null" json:"original_amount"`
	DiscountPercent float64   `gorm:"not null" json:"discount_percent"`
	DiscountAmount  float64   `gorm:"not null" json:"discount_amount"`
	FinalAmount     float64   `gorm:"not null" json:"final_amount"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	PromoCode *PromoCode `gorm:"foreignKey:PromoCodeID" json:"promo_code,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Payment   *Payment   `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
}
