package models

import "time"

// NotificationPreference — foydalanuvchi bildirishnoma sozlamalari
// Har bir user qaysi kategoriya bildirishnomalarni olishni tanlaydi
type NotificationPreference struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	Olympiads    bool      `gorm:"default:true;not null" json:"olympiads"`     // Olimpiadalar
	Payments     bool      `gorm:"default:true;not null" json:"payments"`      // To'lovlar
	News         bool      `gorm:"default:true;not null" json:"news"`          // Yangiliklar
	MockTests    bool      `gorm:"default:true;not null" json:"mock_tests"`    // Mock testlar
	Results      bool      `gorm:"default:true;not null" json:"results"`       // Natijalar
	Certificates bool      `gorm:"default:true;not null" json:"certificates"`  // Sertifikatlar
	Leaderboard  bool      `gorm:"default:true;not null" json:"leaderboard"`   // Leaderboard
	Promotions   bool      `gorm:"default:true;not null" json:"promotions"`    // Promo code va chegirmalar
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// NotificationCategory — bildirishnoma kategoriyasi (type → category mapping)
// NotificationType larni kategoriyaga moslashtiradi
var NotificationTypeToCategory = map[string]string{
	// Olympiad
	"olympiad_published": "olympiads",
	"olympiad_joined":    "olympiads",
	"olympiad_starting":  "olympiads",
	"olympiad_result":    "olympiads",

	// Mock test
	"mock_test_published": "mock_tests",
	"mock_test_joined":    "mock_tests",
	"mock_test_result":    "mock_tests",

	// Payment
	"payment_success": "payments",
	"payment_failed":  "payments",

	// News
	"news_published": "news",
	"announcement":   "news",

	// Certificate
	"certificate_ready": "certificates",

	// Results
	"result_published": "results",

	// Leaderboard
	"leaderboard_update": "leaderboard",

	// Promo
	"promo_applied": "promotions",

	// System — doim yuboriladi, sozlama ta'sir qilmaydi
	"system":    "system",
	"welcome":   "system",
	"new_login": "system",
}
