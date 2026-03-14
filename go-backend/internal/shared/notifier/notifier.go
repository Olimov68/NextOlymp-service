package notifier

import (
	"fmt"
	"log"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

// NotificationType — bildirishnoma turlari
const (
	// Payment
	TypePaymentSuccess = "payment_success"
	TypePaymentFailed  = "payment_failed"

	// Olympiad
	TypeOlympiadPublished = "olympiad_published"
	TypeOlympiadJoined    = "olympiad_joined"
	TypeOlympiadStarting  = "olympiad_starting"
	TypeOlympiadResult    = "olympiad_result"

	// Mock test
	TypeMockTestPublished = "mock_test_published"
	TypeMockTestJoined    = "mock_test_joined"
	TypeMockTestResult    = "mock_test_result"

	// News & announcements
	TypeNewsPublished = "news_published"
	TypeAnnouncement  = "announcement"

	// Certificate
	TypeCertificateReady = "certificate_ready"

	// Result / Leaderboard
	TypeResultPublished   = "result_published"
	TypeLeaderboardUpdate = "leaderboard_update"

	// System
	TypeSystem   = "system"
	TypeWelcome  = "welcome"
	TypeNewLogin = "new_login"

	// Promo
	TypePromoApplied = "promo_applied"
)

// SourceType — bildirishnoma manbai turlari
const (
	SourceOlympiad    = "olympiad"
	SourceMockTest    = "mock_test"
	SourcePayment     = "payment"
	SourceNews        = "news"
	SourceCertificate = "certificate"
	SourceResult      = "result"
	SourceSystem      = "system"
	SourcePromoCode   = "promo_code"
)

// Notifier — bildirishnoma yaratish service
type Notifier struct {
	db *gorm.DB
}

// New — yangi notifier yaratish
func New(db *gorm.DB) *Notifier {
	return &Notifier{db: db}
}

// isUserOptedIn — user shu kategoriya bildirishnomalarni yoqqanmi tekshiradi
// system kategoriyasi doim true qaytaradi
func (n *Notifier) isUserOptedIn(userID uint, notifType string) bool {
	category, ok := models.NotificationTypeToCategory[notifType]
	if !ok || category == "system" {
		return true // noma'lum yoki system turi → doim yuboriladi
	}

	var pref models.NotificationPreference
	err := n.db.Where("user_id = ?", userID).First(&pref).Error
	if err != nil {
		// Preference topilmadi → default: hammasi yoniq
		return true
	}

	switch category {
	case "olympiads":
		return pref.Olympiads
	case "payments":
		return pref.Payments
	case "news":
		return pref.News
	case "mock_tests":
		return pref.MockTests
	case "results":
		return pref.Results
	case "certificates":
		return pref.Certificates
	case "leaderboard":
		return pref.Leaderboard
	case "promotions":
		return pref.Promotions
	default:
		return true
	}
}

// Send — asosiy bildirishnoma yaratish funksiyasi (preference tekshiradi)
func (n *Notifier) Send(userID uint, notifType, title, message, actionURL, sourceType string, sourceID *uint) {
	if !n.isUserOptedIn(userID, notifType) {
		return // user bu kategoriyani o'chirib qo'ygan
	}

	notification := models.Notification{
		UserID:     userID,
		Type:       notifType,
		Title:      title,
		Message:    message,
		ActionURL:  actionURL,
		SourceType: sourceType,
		SourceID:   sourceID,
	}
	if err := n.db.Create(&notification).Error; err != nil {
		log.Printf("[Notifier] Error creating notification: %v", err)
	}
}

// SendBulk — ko'plab userlarga bildirishnoma yuborish (preference filtrlanadi)
func (n *Notifier) SendBulk(userIDs []uint, notifType, title, message, actionURL, sourceType string, sourceID *uint) {
	for _, uid := range userIDs {
		n.Send(uid, notifType, title, message, actionURL, sourceType, sourceID)
	}
}

// SendToAll — barcha foydalanuvchilarga bildirishnoma yuborish (preference filtrlanadi)
func (n *Notifier) SendToAll(notifType, title, message, actionURL, sourceType string, sourceID *uint) {
	var userIDs []uint
	n.db.Model(&models.User{}).Pluck("id", &userIDs)
	n.SendBulk(userIDs, notifType, title, message, actionURL, sourceType, sourceID)
}

// SendToCategory — faqat shu kategoriyani yoqqan userlarga yuborish
// Admin notification yuborayotganda shu metod ishlatiladi
func (n *Notifier) SendToCategory(category, notifType, title, message, actionURL, sourceType string, sourceID *uint) {
	var userIDs []uint

	// Shu kategoriyani yoqqan userlarni topish
	query := n.db.Model(&models.NotificationPreference{})
	switch category {
	case "olympiads":
		query = query.Where("olympiads = true")
	case "payments":
		query = query.Where("payments = true")
	case "news":
		query = query.Where("news = true")
	case "mock_tests":
		query = query.Where("mock_tests = true")
	case "results":
		query = query.Where("results = true")
	case "certificates":
		query = query.Where("certificates = true")
	case "leaderboard":
		query = query.Where("leaderboard = true")
	case "promotions":
		query = query.Where("promotions = true")
	default:
		// System yoki noma'lum → barcha userlarga
		n.SendToAll(notifType, title, message, actionURL, sourceType, sourceID)
		return
	}

	query.Pluck("user_id", &userIDs)

	// Preference bo'lmagan (yangi) userlarni ham qo'shish (default = yoniq)
	var allUserIDs []uint
	n.db.Model(&models.User{}).Pluck("id", &allUserIDs)

	// Preference borlar to'plami
	prefUserSet := make(map[uint]bool)
	for _, uid := range userIDs {
		prefUserSet[uid] = true
	}

	// Preference yo'q userlar (default enabled)
	var prefExistIDs []uint
	n.db.Model(&models.NotificationPreference{}).Pluck("user_id", &prefExistIDs)
	prefExistSet := make(map[uint]bool)
	for _, uid := range prefExistIDs {
		prefExistSet[uid] = true
	}

	// Final ro'yxat: pref bor va yoniq + pref yo'q (default)
	finalIDs := make([]uint, 0, len(allUserIDs))
	for _, uid := range allUserIDs {
		if prefExistSet[uid] {
			if prefUserSet[uid] {
				finalIDs = append(finalIDs, uid)
			}
		} else {
			// Preference hali yo'q — default yoniq
			finalIDs = append(finalIDs, uid)
		}
	}

	// Bildirishnoma yaratish (preference tekshirmasdan, chunki allaqachon filtrlandik)
	for _, uid := range finalIDs {
		notification := models.Notification{
			UserID:     uid,
			Type:       notifType,
			Title:      title,
			Message:    message,
			ActionURL:  actionURL,
			SourceType: sourceType,
			SourceID:   sourceID,
		}
		if err := n.db.Create(&notification).Error; err != nil {
			log.Printf("[Notifier] Error creating notification for user %d: %v", uid, err)
		}
	}
}

// --- Convenience methods ---

// PaymentSuccess — muvaffaqiyatli to'lov bildirishnomasi
func (n *Notifier) PaymentSuccess(userID uint, paymentID uint, amount float64, description string) {
	n.Send(userID, TypePaymentSuccess,
		"To'lov muvaffaqiyatli",
		fmt.Sprintf("%.0f UZS miqdorida to'lov qabul qilindi. %s", amount, description),
		"",
		SourcePayment, &paymentID,
	)
}

// PaymentFailed — muvaffaqiyatsiz to'lov
func (n *Notifier) PaymentFailed(userID uint, paymentID uint, amount float64) {
	n.Send(userID, TypePaymentFailed,
		"To'lov amalga oshmadi",
		fmt.Sprintf("%.0f UZS miqdoridagi to'lov amalga oshmadi", amount),
		"",
		SourcePayment, &paymentID,
	)
}

// OlympiadPublished — yangi olimpiada e'lon qilindi (kategoriya bo'yicha filtrlanadi)
func (n *Notifier) OlympiadPublished(olympiadID uint, title string) {
	n.SendToCategory("olympiads", TypeOlympiadPublished,
		"Yangi olimpiada e'lon qilindi!",
		fmt.Sprintf("'%s' olimpiadasi boshlandi. Ishtirok etish uchun ro'yxatdan o'ting!", title),
		fmt.Sprintf("/olympiads/%d", olympiadID),
		SourceOlympiad, &olympiadID,
	)
}

// OlympiadJoined — olimpiadaga qo'shildi
func (n *Notifier) OlympiadJoined(userID uint, olympiadID uint, title string) {
	n.Send(userID, TypeOlympiadJoined,
		"Olimpiadaga ro'yxatdan o'tdingiz",
		fmt.Sprintf("'%s' olimpiadasiga muvaffaqiyatli ro'yxatdan o'tdingiz", title),
		fmt.Sprintf("/olympiads/%d", olympiadID),
		SourceOlympiad, &olympiadID,
	)
}

// OlympiadResult — olimpiada natijasi tayyor
func (n *Notifier) OlympiadResult(userID uint, olympiadID uint, title string) {
	n.Send(userID, TypeOlympiadResult,
		"Olimpiada natijangiz tayyor",
		fmt.Sprintf("'%s' olimpiadasi natijangiz tayyor. Tekshiring!", title),
		"/results/olympiads",
		SourceOlympiad, &olympiadID,
	)
}

// MockTestPublished — yangi mock test e'lon qilindi (kategoriya bo'yicha filtrlanadi)
func (n *Notifier) MockTestPublished(mockTestID uint, title string) {
	n.SendToCategory("mock_tests", TypeMockTestPublished,
		"Yangi sinov testi e'lon qilindi!",
		fmt.Sprintf("'%s' sinov testi qo'shildi. Sinovdan o'ting!", title),
		fmt.Sprintf("/mock-tests/%d", mockTestID),
		SourceMockTest, &mockTestID,
	)
}

// MockTestJoined — mock testga qo'shildi
func (n *Notifier) MockTestJoined(userID uint, mockTestID uint, title string) {
	n.Send(userID, TypeMockTestJoined,
		"Sinov testiga ro'yxatdan o'tdingiz",
		fmt.Sprintf("'%s' sinov testiga muvaffaqiyatli ro'yxatdan o'tdingiz", title),
		fmt.Sprintf("/mock-tests/%d", mockTestID),
		SourceMockTest, &mockTestID,
	)
}

// MockTestResult — mock test natijasi tayyor
func (n *Notifier) MockTestResult(userID uint, mockTestID uint, title string, score string) {
	n.Send(userID, TypeMockTestResult,
		"Sinov test natijangiz tayyor",
		fmt.Sprintf("'%s' natijangiz: %s", title, score),
		"/results/mock-tests",
		SourceMockTest, &mockTestID,
	)
}

// NewsPublished — yangi yangilik e'lon qilindi (kategoriya bo'yicha filtrlanadi)
func (n *Notifier) NewsPublished(newsID uint, title string) {
	n.SendToCategory("news", TypeNewsPublished,
		"Yangi yangilik",
		fmt.Sprintf("'%s' — yangi yangilik e'lon qilindi!", title),
		fmt.Sprintf("/news/%d", newsID),
		SourceNews, &newsID,
	)
}

// CertificateReady — sertifikat tayyor
func (n *Notifier) CertificateReady(userID uint, certID uint, title string) {
	n.Send(userID, TypeCertificateReady,
		"Sertifikatingiz tayyor!",
		fmt.Sprintf("'%s' sertifikatingiz tayyor. Yuklab oling!", title),
		"/certificates",
		SourceCertificate, &certID,
	)
}

// Welcome — yangi foydalanuvchi uchun xush kelibsiz
func (n *Notifier) Welcome(userID uint) {
	n.Send(userID, TypeWelcome,
		"Xush kelibsiz!",
		"NextOlymp platformasiga xush kelibsiz! Olimpiada va sinov testlaridan o'ting.",
		"/",
		SourceSystem, nil,
	)
}

// System — tizim bildirishnomasi
func (n *Notifier) System(userID uint, title, message string) {
	n.Send(userID, TypeSystem, title, message, "", SourceSystem, nil)
}

// SystemToAll — barcha foydalanuvchilarga tizim bildirishnomasi
func (n *Notifier) SystemToAll(title, message string) {
	n.SendToAll(TypeSystem, title, message, "", SourceSystem, nil)
}

// NewLogin — yangi qurilmadan kirish bildirishnomasi (xavfsizlik)
func (n *Notifier) NewLogin(userID uint, deviceName, ipAddress string) {
	n.Send(userID, TypeNewLogin,
		"Yangi qurilmadan kirish",
		fmt.Sprintf("Akkauntingizga '%s' qurilmasidan kirildi (IP: %s). Agar bu siz bo'lmasangiz, parolingizni o'zgartiring!", deviceName, ipAddress),
		"/profile/devices",
		SourceSystem, nil,
	)
}

// PromoApplied — promo kod muvaffaqiyatli qo'llanildi
func (n *Notifier) PromoApplied(userID uint, code string, discountAmount float64) {
	n.Send(userID, TypePromoApplied,
		"Promo kod qo'llanildi",
		fmt.Sprintf("'%s' promo kodi bilan %.0f UZS chegirma oldiniz", code, discountAmount),
		"",
		SourcePromoCode, nil,
	)
}
