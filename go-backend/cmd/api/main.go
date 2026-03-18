package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/cache"
	"github.com/nextolympservice/go-backend/internal/database"
	"github.com/nextolympservice/go-backend/internal/router"
	"github.com/nextolympservice/go-backend/internal/utils"
)

func main() {
	// Config yuklash
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Custom validatorlarni ro'yxatga olish
	utils.SetupValidator()

	// Database ulanish
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// Auto migration
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Redis ulanish
	var redisClient *cache.RedisClient
	redisClient, err = cache.NewRedisClient(&cache.RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	if err != nil {
		log.Printf("WARNING: Redis ulanmadi: %v (DB fallback ishlatiladi)", err)
		redisClient = nil
	}

	// Router sozlash
	r := router.Setup(cfg, db, redisClient)

	// Graceful shutdown
	addr := fmt.Sprintf(":%s", cfg.App.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Background: expired session cleanup (har 1 soatda)
	sessionMgr := utils.NewSessionManager(db)
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			sessionMgr.CleanupExpired()
		}
	}()

	// Server ishga tushirish (goroutine)
	go func() {
		log.Printf("Server starting on %s (env: %s)", addr, cfg.App.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown signallarni kutish
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	// Redis yopish
	if redisClient != nil {
		if err := redisClient.Close(); err != nil {
			log.Printf("Redis close error: %v", err)
		}
	}

	log.Println("Server exited gracefully")
}
