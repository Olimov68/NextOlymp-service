package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	DB       DBConfig
	Redis    RedisConfig
	JWT      JWTConfig
	PanelJWT PanelJWTConfig
	Upload   UploadConfig
	Telegram TelegramConfig
	CORS     CORSConfig
	Payme    PaymeConfig
	Google          GoogleConfig
	AnthropicAPIKey string
}

type GoogleConfig struct {
	ClientID string
}

type PaymeConfig struct {
	MerchantID string
	Key        string
	TestKey    string
	TestMode   bool
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type CORSConfig struct {
	AllowedOrigins []string
}

type AppConfig struct {
	Port    string
	Env     string
	BaseURL string
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	AccessSecret       string
	RefreshSecret      string
	AccessExpiryHours  int
	RefreshExpiryHours int
}

type UploadConfig struct {
	Dir       string
	MaxSizeMB int
}

type TelegramConfig struct {
	BotToken    string
	BotUsername string
}

type PanelJWTConfig struct {
	AccessSecret       string
	RefreshSecret      string
	AccessExpiryHours  int
	RefreshExpiryHours int
}

func (db DBConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		db.Host, db.Port, db.User, db.Password, db.Name, db.SSLMode,
	)
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	accessExpiry, _ := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRY_HOURS", "1"))
	refreshExpiry, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_HOURS", "168"))
	panelAccessExpiry, _ := strconv.Atoi(getEnv("PANEL_JWT_ACCESS_EXPIRY_HOURS", "8"))
	panelRefreshExpiry, _ := strconv.Atoi(getEnv("PANEL_JWT_REFRESH_EXPIRY_HOURS", "168"))
	maxSize, _ := strconv.Atoi(getEnv("MAX_UPLOAD_SIZE_MB", "5"))
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))

	// CORS origins
	corsOrigins := strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}

	paymeTestMode := getEnv("PAYME_TEST_MODE", "true") == "true"

	appPort := getEnv("APP_PORT", "8080")
	appBaseURL := getEnv("APP_BASE_URL", fmt.Sprintf("http://localhost:%s", appPort))

	cfg := &Config{
		App: AppConfig{
			Port:    appPort,
			Env:     getEnv("APP_ENV", "development"),
			BaseURL: appBaseURL,
		},
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "nextolympservice"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       redisDB,
		},
		CORS: CORSConfig{
			AllowedOrigins: corsOrigins,
		},
		JWT: JWTConfig{
			AccessSecret:       getEnv("JWT_ACCESS_SECRET", ""),
			RefreshSecret:      getEnv("JWT_REFRESH_SECRET", ""),
			AccessExpiryHours:  accessExpiry,
			RefreshExpiryHours: refreshExpiry,
		},
		Upload: UploadConfig{
			Dir:       getEnv("UPLOAD_DIR", "./uploads"),
			MaxSizeMB: maxSize,
		},
		Telegram: TelegramConfig{
			BotToken:    getEnv("TELEGRAM_BOT_TOKEN", ""),
			BotUsername: getEnv("TELEGRAM_BOT_USERNAME", ""),
		},
		PanelJWT: PanelJWTConfig{
			AccessSecret:       getEnv("PANEL_JWT_ACCESS_SECRET", ""),
			RefreshSecret:      getEnv("PANEL_JWT_REFRESH_SECRET", ""),
			AccessExpiryHours:  panelAccessExpiry,
			RefreshExpiryHours: panelRefreshExpiry,
		},
		Payme: PaymeConfig{
			MerchantID: getEnv("PAYME_MERCHANT_ID", ""),
			Key:        getEnv("PAYME_KEY", ""),
			TestKey:    getEnv("PAYME_TEST_KEY", ""),
			TestMode:   paymeTestMode,
		},
		Google: GoogleConfig{
			ClientID: getEnv("GOOGLE_CLIENT_ID", ""),
		},
		AnthropicAPIKey: getEnv("ANTHROPIC_API_KEY", ""),
	}

	if cfg.JWT.AccessSecret == "" || cfg.JWT.RefreshSecret == "" {
		return nil, fmt.Errorf("JWT secrets must be set")
	}
	if cfg.PanelJWT.AccessSecret == "" || cfg.PanelJWT.RefreshSecret == "" {
		return nil, fmt.Errorf("PANEL_JWT secrets must be set")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
