package database

import (
	"fmt"
	"log"

	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	logLevel := logger.Warn
	if cfg.App.Env == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	log.Println("Database connected successfully")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	// telegram_codes schema changed (user_id → telegram_id), drop and recreate
	if db.Migrator().HasColumn(&models.TelegramCode{}, "user_id") {
		db.Migrator().DropTable(&models.TelegramCode{})
	}

	err := db.AutoMigrate(
		// Core user tables
		&models.User{},
		&models.Profile{},
		&models.TelegramLink{},
		&models.TelegramCode{},
		// Panel staff & permissions
		&models.StaffUser{},
		&models.Permission{},
		&models.StaffPermission{},
		// Content & media
		&models.Content{},
		&models.Certificate{},
		&models.CertificateTemplate{},
		// Questions & options
		&models.Question{},
		&models.QuestionOption{},
		// Olympiads
		&models.Olympiad{},
		&models.OlympiadRegistration{},
		&models.OlympiadAttempt{},
		&models.OlympiadAttemptAnswer{},
		// Mock tests
		&models.MockTest{},
		&models.MockTestRegistration{},
		&models.MockAttempt{},
		&models.MockAttemptAnswer{},
		&models.MockTestQuestionStat{},
		// Communication
		&models.Notification{},
		&models.NotificationPreference{},
		// Finance
		&models.Payment{},
		&models.Balance{},
		&models.BalanceTransaction{},
		// Promo codes
		&models.PromoCode{},
		&models.PromoCodeUsage{},
		// Security & sessions
		&models.Session{},
		&models.LoginAttempt{},
		// System
		&models.AuditLog{},
		&models.SystemSetting{},
		&models.SecuritySetting{},
		&models.GlobalSetting{},
		&models.PasswordResetCode{},
		// Chat
		&models.ChatMessage{},
		&models.ChatBan{},
		&models.ChatSetting{},
		&models.ChatRoom{},
		&models.ChatModerationLog{},
		// Anti-cheat & Security events
		&models.AntiCheatViolation{},
		&models.SuspiciousEvent{},
		// User verification
		&models.UserVerification{},
		// Payme transactions
		&models.PaymeTransaction{},
		// AI Analysis
		&models.AIAnalysis{},
	)
	if err != nil {
		log.Printf("MIGRATION ERROR: %v", err)
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database migration completed")

	// Fix: bo'sh google_id va email stringlarni NULL ga o'zgartirish
	db.Exec("UPDATE \"user\" SET google_id = NULL WHERE google_id = ''")
	db.Exec("UPDATE \"user\" SET email = NULL WHERE email = ''")

	// Verify tables were created
	var count int64
	db.Raw("SELECT COUNT(*) FROM pg_class WHERE relkind='r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')").Scan(&count)
	log.Printf("Tables in public schema: %d", count)

	// Auto-create superadmin if not exists
	seedSuperAdmin(db)

	// Auto-seed permissions if empty
	seedPermissions(db)

	return nil
}

func seedSuperAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.StaffUser{}).Where("role = ?", "superadmin").Count(&count)
	if count > 0 {
		log.Println("SuperAdmin already exists")
		return
	}

	hash, err := utils.HashPassword("SuperAdmin123!")
	if err != nil {
		log.Println("Warning: failed to hash superadmin password:", err)
		return
	}

	superadmin := &models.StaffUser{
		Username:     "superadmin",
		PasswordHash: hash,
		FullName:     "Super Administrator",
		Role:         models.StaffRoleSuperAdmin,
		Status:       models.StaffStatusActive,
	}

	if err := db.Create(superadmin).Error; err != nil {
		log.Println("Warning: failed to create superadmin:", err)
		return
	}

	log.Printf("SuperAdmin created (username: superadmin, password: SuperAdmin123!)")
}

func seedPermissions(db *gorm.DB) {
	var count int64
	db.Model(&models.Permission{}).Count(&count)
	if count > 0 {
		return
	}

	permissions := []models.Permission{
		// Olympiads
		{Code: "olympiads.view", Name: "Olimpiadalarni ko'rish", Module: "olympiads"},
		{Code: "olympiads.create", Name: "Olimpiada yaratish", Module: "olympiads"},
		{Code: "olympiads.edit", Name: "Olimpiada tahrirlash", Module: "olympiads"},
		{Code: "olympiads.delete", Name: "Olimpiada o'chirish", Module: "olympiads"},
		{Code: "olympiads.manage", Name: "Olimpiadalarni boshqarish", Module: "olympiads"},
		// Mock tests
		{Code: "mock_tests.view", Name: "Mock testlarni ko'rish", Module: "mock_tests"},
		{Code: "mock_tests.create", Name: "Mock test yaratish", Module: "mock_tests"},
		{Code: "mock_tests.edit", Name: "Mock test tahrirlash", Module: "mock_tests"},
		{Code: "mock_tests.delete", Name: "Mock test o'chirish", Module: "mock_tests"},
		{Code: "mock_tests.manage", Name: "Mock testlarni boshqarish", Module: "mock_tests"},
		// Users
		{Code: "users.view", Name: "Foydalanuvchilarni ko'rish", Module: "users"},
		{Code: "users.edit", Name: "Foydalanuvchilarni tahrirlash", Module: "users"},
		{Code: "users.block", Name: "Foydalanuvchilarni bloklash", Module: "users"},
		{Code: "users.verify", Name: "Foydalanuvchilarni tasdiqlash", Module: "users"},
		{Code: "users.manage", Name: "Foydalanuvchilarni boshqarish", Module: "users"},
		// Chat
		{Code: "chat.view", Name: "Chatni ko'rish", Module: "chat"},
		{Code: "chat.moderate", Name: "Chat moderatsiya", Module: "chat"},
		{Code: "chat.manage", Name: "Chatni boshqarish", Module: "chat"},
		// Results
		{Code: "results.view", Name: "Natijalarni ko'rish", Module: "results"},
		{Code: "results.manage", Name: "Natijalarni boshqarish", Module: "results"},
		// News
		{Code: "news.view", Name: "Yangiliklar ko'rish", Module: "news"},
		{Code: "news.create", Name: "Yangilik yaratish", Module: "news"},
		{Code: "news.edit", Name: "Yangilik tahrirlash", Module: "news"},
		{Code: "news.manage", Name: "Yangiliklar boshqarish", Module: "news"},
		// Certificates
		{Code: "certificates.view", Name: "Sertifikatlar ko'rish", Module: "certificates"},
		{Code: "certificates.manage", Name: "Sertifikatlar boshqarish", Module: "certificates"},
	}

	for _, p := range permissions {
		db.FirstOrCreate(&p, models.Permission{Code: p.Code})
	}

	log.Printf("Permissions seeded: %d permissions", len(permissions))
}
