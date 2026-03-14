package database

import (
	"fmt"
	"log"

	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/models"
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
		&models.Feedback{},
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
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database migration completed")
	return nil
}
