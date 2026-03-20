package router

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/middleware"

	// Existing modules
	"github.com/nextolympservice/go-backend/internal/modules/auth"
	"github.com/nextolympservice/go-backend/internal/modules/telegram"
	"github.com/nextolympservice/go-backend/internal/modules/user"

	// Chat
	"github.com/nextolympservice/go-backend/internal/chat"

	// Upload
	"github.com/nextolympservice/go-backend/internal/upload"

	// Payme
	"github.com/nextolympservice/go-backend/internal/payme"

	// Panel auth
	panelauth "github.com/nextolympservice/go-backend/internal/panel/auth"

	// User modules
	userbalance "github.com/nextolympservice/go-backend/internal/user/balance"
	usercerts "github.com/nextolympservice/go-backend/internal/user/certificates"
	userdevices "github.com/nextolympservice/go-backend/internal/user/devices"
	userleaderboard "github.com/nextolympservice/go-backend/internal/user/leaderboard"
	userexams "github.com/nextolympservice/go-backend/internal/user/exams"
usermocktests "github.com/nextolympservice/go-backend/internal/user/mocktests"
	usernews "github.com/nextolympservice/go-backend/internal/user/news"
	usernotifs "github.com/nextolympservice/go-backend/internal/user/notifications"
	userolympiads "github.com/nextolympservice/go-backend/internal/user/olympiads"
	userpromos "github.com/nextolympservice/go-backend/internal/user/promocodes"
	userai "github.com/nextolympservice/go-backend/internal/user/ai"
	useranticheat "github.com/nextolympservice/go-backend/internal/user/anticheat"
	userresults "github.com/nextolympservice/go-backend/internal/user/results"

	// Public verify
	publicverify "github.com/nextolympservice/go-backend/internal/public/verify"

	// Admin verifications (for user-facing verification status)
	adminverifications "github.com/nextolympservice/go-backend/internal/admin/verifications"

	// Admin centralized routes
	adminroutes "github.com/nextolympservice/go-backend/internal/admin/routes"

	// Shared
	"github.com/nextolympservice/go-backend/internal/shared/notifier"

	// Superadmin centralized routes
	saroutes "github.com/nextolympservice/go-backend/internal/superadmin/routes"

	"github.com/nextolympservice/go-backend/internal/cache"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

func Setup(cfg *config.Config, db *gorm.DB, redisClient *cache.RedisClient) *gin.Engine {
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.SecurityHeaders())

	// CORS: production da aniq originlar, development da hamma
	if cfg.App.Env == "production" && len(cfg.CORS.AllowedOrigins) > 0 {
		r.Use(middleware.CORSWithOrigins(cfg.CORS.AllowedOrigins))
	} else {
		r.Use(middleware.CORS())
	}

	r.Static("/uploads", cfg.Upload.Dir)

	// JWT managers
	jwtManager := utils.NewJWTManager(&cfg.JWT)
	panelJWT := utils.NewPanelJWTManager(&cfg.PanelJWT)

	// ─── Session & Notifier ──────────────────────────────────────────
	sessionMgr := utils.NewSessionManager(db)
	appNotifier := notifier.New(db)

	// ─── Existing modules ─────────────────────────────────────────────
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, jwtManager)
	authService.SetSessionManager(sessionMgr)
	authService.SetNotifier(appNotifier)
	authHandler := auth.NewHandler(authService)
	authHandler.SetDB(db)

	// Telegram sender ni auth service ga ulash (parol tiklash uchun)
	telegramRepo := telegram.NewRepository(db)
	telegramService := telegram.NewService(telegramRepo, &cfg.Telegram)
	authService.SetTelegramSender(telegramService, telegramService.BotURL(), cfg.Telegram.BotUsername)
	authService.SetGoogleClientID(cfg.Google.ClientID)

	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo, &cfg.Upload)
	userHandler := user.NewHandler(userService)

	telegramHandler := telegram.NewHandler(telegramService)

	// ─── Panel auth ───────────────────────────────────────────────────
	panelAuthRepo := panelauth.NewRepository(db)
	panelAuthService := panelauth.NewService(panelAuthRepo, panelJWT)
	panelAuthHandler := panelauth.NewHandler(panelAuthService)
	panelAuthHandler.SetDB(db)

	// ─── User modules ─────────────────────────────────────────────────
	olympiadsHandler := userolympiads.NewHandler(userolympiads.NewService(userolympiads.NewRepository(db)))
	mockTestsHandler := usermocktests.NewHandler(usermocktests.NewService(usermocktests.NewRepository(db)))
	newsHandler := usernews.NewHandler(usernews.NewService(usernews.NewRepository(db)))
	certsHandler := usercerts.NewHandler(usercerts.NewService(usercerts.NewRepository(db)), cfg.Upload.Dir)
examsHandler := userexams.NewHandler(db)
	balanceHandler := userbalance.NewHandler(db)
	notifsHandler := usernotifs.NewHandler(db)
	promosHandler := userpromos.NewHandler(db)
	userResultsHandler := userresults.NewHandler(db)
	devicesHandler := userdevices.NewHandler(sessionMgr)
	leaderboardHandler := userleaderboard.NewHandler(db)
	anticheatHandler := useranticheat.NewHandler(db)
	aiHandler := userai.NewHandler(db, cfg.AnthropicAPIKey)

	// ─── Chat ─────────────────────────────────────────────────────
	chatHub := chat.NewHub()
	go chatHub.Run()
	chatHandler := chat.NewHandler(db, chatHub)

	// ─── Upload ──────────────────────────────────────────────────────
	baseURL := fmt.Sprintf("http://localhost:%s", cfg.App.Port)
	uploadHandler := upload.NewHandler(cfg.Upload.Dir, baseURL)

	// ─── Payme ────────────────────────────────────────────────────────────
	paymeHandler := payme.NewHandler(db, &cfg.Payme)

	// Rate limiter
	var rateLimiter *cache.RateLimiter
	if redisClient != nil {
		rateLimiter = cache.NewRateLimiter(redisClient, cache.DefaultRateLimitConfig())
	}

	// Session store (Redis cache)
	var sessionStore *cache.SessionStore
	if redisClient != nil {
		sessionStore = cache.NewSessionStore(redisClient)
	}

	_ = sessionStore // Will be used in auth middleware enhancement

	// Health check
	r.GET("/health", func(c *gin.Context) {
		health := gin.H{"status": "healthy", "database": "connected"}

		if redisClient != nil {
			redisHealth := redisClient.Health(c.Request.Context())
			health["redis"] = redisHealth
		} else {
			health["redis"] = gin.H{"status": "not_configured"}
		}

		response.Success(c, 200, "OK", health)
	})

	api := r.Group("/api/v1")
	api.Use(middleware.AuditLogger(db))
	api.Use(middleware.MaintenanceMode(db))

	// ============================================================
	// MAVJUD USER AUTH ROUTES (o'zgarmadi)
	// ============================================================
	authGroup := api.Group("/auth")
	{
		authGroup.POST("/register", middleware.RateLimitRegister(rateLimiter), authHandler.Register)
		authGroup.POST("/login", middleware.RateLimitLogin(rateLimiter), authHandler.Login)
		authGroup.POST("/google", authHandler.GoogleAuth)
		authGroup.POST("/refresh", authHandler.RefreshToken)
		// Parol tiklash
		authGroup.POST("/recovery/identify", middleware.RateLimitLogin(rateLimiter), authHandler.RecoveryIdentify)
		authGroup.POST("/recovery/verify", authHandler.RecoveryVerify)
		authGroup.POST("/recovery/reset", authHandler.RecoveryReset)
	}

	// ============================================================
	// PUBLIC SETTINGS — /api/v1/settings/public (auth talab qilinmaydi)
	// ============================================================
	api.GET("/settings/public", func(c *gin.Context) {
		var setting models.GlobalSetting
		if db.First(&setting).Error != nil {
			setting = models.GlobalSetting{
				PlatformName:        "NextOlymp",
				DefaultLanguage:     "uz",
				SupportEmail:        "",
				MaintenanceMode:     false,
				RegistrationEnabled: true,
			}
			db.Create(&setting)
		}
		response.Success(c, 200, "Public settings", gin.H{
			"platform_name":                  setting.PlatformName,
			"support_email":                  setting.SupportEmail,
			"maintenance_mode":               setting.MaintenanceMode,
			"registration_enabled":           setting.RegistrationEnabled,
			"telegram_verification_enabled":  setting.TelegramVerificationEnabled,
			"default_language":               setting.DefaultLanguage,
		})
	})

	// ============================================================
	// PUBLIC NEWS — /api/v1/news (auth talab qilinmaydi, hammaga ochiq)
	// ============================================================
	publicNewsHandler := usernews.NewHandler(usernews.NewService(usernews.NewRepository(db)))
	publicNews := api.Group("/news")
	{
		publicNews.GET("", publicNewsHandler.List)
		publicNews.GET("/:id", publicNewsHandler.GetByID)
	}

	// ============================================================
	// PUBLIC VERIFY — /api/v1/certificates/verify (auth talab qilinmaydi)
	// ============================================================
	verifyHandler := publicverify.NewHandler(db)
	api.GET("/certificates/verify/:code", verifyHandler.VerifyCertificate)

	// ============================================================
	// PUBLIC STATS — /api/v1/stats (auth talab qilinmaydi)
	// ============================================================
	api.GET("/stats", func(c *gin.Context) {
		var totalUsers int64
		var totalOlympiads int64
		var totalMockTests int64

		db.Model(&models.User{}).Count(&totalUsers)
		db.Model(&models.Olympiad{}).Count(&totalOlympiads)
		db.Model(&models.MockTest{}).Count(&totalMockTests)

		response.Success(c, 200, "Stats", gin.H{
			"total_users":      totalUsers,
			"total_olympiads":  totalOlympiads,
			"total_regions":    12,
			"total_mock_tests": totalMockTests,
		})
	})

	protected := api.Group("")
	protected.Use(middleware.AuthRequired(jwtManager, db))
	{
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/auth/me", authHandler.Me)

		// Upload
		protected.POST("/upload", uploadHandler.Upload)

		profileGroup := protected.Group("/profile")
		{
			profileGroup.POST("/complete", userHandler.CompleteProfile)
			profileGroup.PUT("/me", userHandler.UpdateProfile)
			profileGroup.GET("/me", userHandler.GetProfile)
			profileGroup.POST("/photo", userHandler.UploadPhoto)
			profileGroup.PUT("/password", authHandler.ChangePassword)
		}

		protected.GET("/profile/verification-status", adminverifications.NewHandler(db).GetVerificationStatus)

		telegramGroup := protected.Group("/telegram")
		{
			telegramGroup.POST("/verify", telegramHandler.VerifyCode)
			telegramGroup.GET("/status", telegramHandler.CheckStatus)
		}
	}
	api.POST("/telegram/webhook", telegramHandler.Webhook)

	// Payme Merchant API endpoint (NO auth middleware — Payme calls this directly)
	api.POST("/payme", paymeHandler.Handle)

	// ============================================================
	// USER ROUTES — /api/v1/user/...
	// ============================================================
	userAPI := api.Group("/user")
	userAPI.Use(middleware.AuthRequired(jwtManager, db))
	userAPI.Use(middleware.ProfileRequired())
	{
		// Olympiads
		og := userAPI.Group("/olympiads")
		{
			og.GET("", olympiadsHandler.List)
			og.GET("/my", olympiadsHandler.MyOlympiads)
			og.GET("/:id", olympiadsHandler.GetByID)
			og.POST("/:id/join", olympiadsHandler.Join)
		}

		// Mock tests
		mg := userAPI.Group("/mock-tests")
		{
			mg.GET("", mockTestsHandler.List)
			mg.GET("/my", mockTestsHandler.MyMockTests)
			mg.GET("/:id", mockTestsHandler.GetByID)
			mg.POST("/:id/join", mockTestsHandler.Join)
		}

		// News
		ng := userAPI.Group("/news")
		{
			ng.GET("", newsHandler.List)
			ng.GET("/:id", newsHandler.GetByID)
		}
		// Certificates
		cg := userAPI.Group("/certificates")
		{
			cg.GET("", certsHandler.List)
			cg.GET("/:id", certsHandler.GetByID)
			cg.GET("/:id/download", certsHandler.Download)
		}

		// Exam — test topshirish
		eg := userAPI.Group("/exams")
		{
			// Mock test topshirish
			eg.POST("/mock-tests/:id/start", examsHandler.StartMockTest)
			eg.POST("/mock-tests/attempts/:attempt_id/answer", examsHandler.SubmitMockAnswer)
			eg.POST("/mock-tests/attempts/:attempt_id/finish", examsHandler.FinishMockTest)
			eg.GET("/mock-tests/attempts/:attempt_id/result", examsHandler.GetMockAttemptResult)
			eg.GET("/mock-tests/:id/my-attempts", examsHandler.GetMyMockAttempts)
			// AI Analysis
			eg.GET("/mock-tests/attempts/:attempt_id/ai-analysis", aiHandler.GetAIAnalysis)
			// Olympiad topshirish
			eg.POST("/olympiads/:id/start", examsHandler.StartOlympiad)
			eg.POST("/olympiads/attempts/:attempt_id/answer", examsHandler.SubmitOlympiadAnswer)
			eg.POST("/olympiads/attempts/:attempt_id/finish", examsHandler.FinishOlympiad)
			eg.GET("/olympiads/attempts/:attempt_id/result", examsHandler.GetOlympiadAttemptResult)
		}

		// Balance (promo-code apply ham shu ichida)
		bg := userAPI.Group("/balance")
		{
			bg.GET("", balanceHandler.GetBalance)
			bg.GET("/transactions", balanceHandler.GetTransactions)
			bg.POST("/topup", balanceHandler.TopUp)
			bg.POST("/promo-code/apply", promosHandler.ApplyPromo)
		}

		// Notifications
		ntfg := userAPI.Group("/notifications")
		{
			ntfg.GET("", notifsHandler.List)
			ntfg.GET("/unread-count", notifsHandler.UnreadCount)
			ntfg.PATCH("/:id/read", notifsHandler.MarkAsRead)
			ntfg.POST("/read-all", notifsHandler.MarkAllAsRead)
			ntfg.DELETE("/:id", notifsHandler.Delete)
			// Bildirishnoma sozlamalari
			ntfg.GET("/preferences", notifsHandler.GetPreferences)
			ntfg.PUT("/preferences", notifsHandler.UpdatePreferences)
			ntfg.GET("/categories", notifsHandler.GetCategories)
		}

		// Results
		resg := userAPI.Group("/results")
		{
			resg.GET("", userResultsHandler.GetMyResults)
			resg.GET("/mock-tests", userResultsHandler.GetMockTestResults)
			resg.GET("/olympiads", userResultsHandler.GetOlympiadResults)
		}

		// Devices — qurilmalar boshqaruvi
		dg := userAPI.Group("/devices")
		{
			dg.GET("", devicesHandler.List)
			dg.GET("/current", devicesHandler.GetCurrent)
			dg.DELETE("/:id", devicesHandler.LogoutDevice)
			dg.POST("/logout-others", devicesHandler.LogoutAllOthers)
			dg.POST("/logout-all", devicesHandler.LogoutAll)
		}

		// Leaderboard
		lg := userAPI.Group("/leaderboard")
		{
			lg.GET("", leaderboardHandler.GetLeaderboard)
			lg.GET("/my-rank", leaderboardHandler.GetMyRank)
		}

		// Anti-cheat
		acg := userAPI.Group("/anticheat")
		{
			acg.POST("/violations", anticheatHandler.ReportViolation)
		}

	}

	// Chat — faqat AuthRequired (ProfileRequired emas, WebSocket upgrade uchun)
	chatAPI := api.Group("/user/chat")
	chatAPI.Use(middleware.AuthRequired(jwtManager, db))
	{
		chatAPI.GET("/ws", chatHandler.HandleWebSocket)
		chatAPI.GET("/messages", chatHandler.GetMessages)
		chatAPI.GET("/online", chatHandler.GetOnlineCount)
		chatAPI.GET("/status", chatHandler.GetChatStatus)
	}

	// ============================================================
	// PANEL AUTH ROUTES — /api/v1/panel/auth/...
	// ============================================================
	panelPub := api.Group("/panel/auth")
	{
		panelPub.POST("/login", panelAuthHandler.Login)
		panelPub.POST("/refresh", panelAuthHandler.RefreshToken)
	}

	panelProt := api.Group("/panel/auth")
	panelProt.Use(middleware.PanelAuthRequired(panelJWT, db))
	{
		panelProt.GET("/me", panelAuthHandler.Me)
		panelProt.GET("/permissions", panelAuthHandler.Permissions)
		panelProt.POST("/logout", panelAuthHandler.Logout)
	}

	// ============================================================
	// ADMIN ROUTES — /api/v1/admin/...
	// admin + superadmin kira oladi (centralized)
	// ============================================================
	adminroutes.Register(api, panelJWT, db, cfg, chatHandler)

	// ============================================================
	// SUPERADMIN ROUTES — /api/v1/superadmin/...
	// faqat superadmin kiradi (centralized)
	// ============================================================
	saroutes.Register(api, panelJWT, db, cfg, chatHandler)

	return r
}
