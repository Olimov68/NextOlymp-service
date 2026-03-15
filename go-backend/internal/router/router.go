package router

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/middleware"

	// Existing modules
	"github.com/nextolympservice/go-backend/internal/modules/auth"
	"github.com/nextolympservice/go-backend/internal/modules/telegram"
	"github.com/nextolympservice/go-backend/internal/modules/user"

	// Panel auth
	panelauth "github.com/nextolympservice/go-backend/internal/panel/auth"

	// User modules
	userbalance "github.com/nextolympservice/go-backend/internal/user/balance"
	usercerts "github.com/nextolympservice/go-backend/internal/user/certificates"
	userdevices "github.com/nextolympservice/go-backend/internal/user/devices"
	userleaderboard "github.com/nextolympservice/go-backend/internal/user/leaderboard"
	userexams "github.com/nextolympservice/go-backend/internal/user/exams"
	userfeedback "github.com/nextolympservice/go-backend/internal/user/feedback"
	usermocktests "github.com/nextolympservice/go-backend/internal/user/mocktests"
	usernews "github.com/nextolympservice/go-backend/internal/user/news"
	usernotifs "github.com/nextolympservice/go-backend/internal/user/notifications"
	userolympiads "github.com/nextolympservice/go-backend/internal/user/olympiads"
	userpromos "github.com/nextolympservice/go-backend/internal/user/promocodes"
	userresults "github.com/nextolympservice/go-backend/internal/user/results"

	// Admin centralized routes
	adminroutes "github.com/nextolympservice/go-backend/internal/admin/routes"

	// Shared
	"github.com/nextolympservice/go-backend/internal/shared/notifier"

	// Superadmin centralized routes
	saroutes "github.com/nextolympservice/go-backend/internal/superadmin/routes"

	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

func Setup(cfg *config.Config, db *gorm.DB) *gin.Engine {
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

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
	certsHandler := usercerts.NewHandler(usercerts.NewService(usercerts.NewRepository(db)))
	feedbackHandler := userfeedback.NewHandler(userfeedback.NewService(userfeedback.NewRepository(db)))
	examsHandler := userexams.NewHandler(db)
	balanceHandler := userbalance.NewHandler(db)
	notifsHandler := usernotifs.NewHandler(db)
	promosHandler := userpromos.NewHandler(db)
	userResultsHandler := userresults.NewHandler(db)
	devicesHandler := userdevices.NewHandler(sessionMgr)
	leaderboardHandler := userleaderboard.NewHandler(db)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		response.Success(c, 200, "OK", gin.H{"status": "healthy"})
	})

	api := r.Group("/api/v1")
	api.Use(middleware.AuditLogger(db))
	api.Use(middleware.MaintenanceMode(db))

	// ============================================================
	// MAVJUD USER AUTH ROUTES (o'zgarmadi)
	// ============================================================
	authGroup := api.Group("/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.RefreshToken)
		// Parol tiklash
		authGroup.POST("/recovery/identify", authHandler.RecoveryIdentify)
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
			"platform_name":        setting.PlatformName,
			"support_email":        setting.SupportEmail,
			"maintenance_mode":     setting.MaintenanceMode,
			"registration_enabled": setting.RegistrationEnabled,
			"default_language":     setting.DefaultLanguage,
		})
	})

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
			"total_regions":    14,
			"total_mock_tests": totalMockTests,
		})
	})

	protected := api.Group("")
	protected.Use(middleware.AuthRequired(jwtManager, db))
	{
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/auth/me", authHandler.Me)

		profileGroup := protected.Group("/profile")
		{
			profileGroup.POST("/complete", userHandler.CompleteProfile)
			profileGroup.PUT("/me", userHandler.UpdateProfile)
			profileGroup.GET("/me", userHandler.GetProfile)
			profileGroup.POST("/photo", userHandler.UploadPhoto)
			profileGroup.PUT("/password", authHandler.ChangePassword)
		}

		telegramGroup := protected.Group("/telegram")
		{
			telegramGroup.POST("/verify", telegramHandler.VerifyCode)
			telegramGroup.GET("/status", telegramHandler.CheckStatus)
		}
	}
	api.POST("/telegram/webhook", telegramHandler.Webhook)

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
		// Announcements
		ag := userAPI.Group("/announcements")
		{
			ag.GET("", newsHandler.List)
			ag.GET("/:id", newsHandler.GetByID)
		}

		// Certificates
		cg := userAPI.Group("/certificates")
		{
			cg.GET("", certsHandler.List)
			cg.GET("/:id", certsHandler.GetByID)
		}

		// Feedback
		fg := userAPI.Group("/feedback")
		{
			fg.POST("", feedbackHandler.Create)
			fg.GET("", feedbackHandler.List)
			fg.GET("/:id", feedbackHandler.GetByID)
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
	adminroutes.Register(api, panelJWT, db, cfg)

	// ============================================================
	// SUPERADMIN ROUTES — /api/v1/superadmin/...
	// faqat superadmin kiradi (centralized)
	// ============================================================
	saroutes.Register(api, panelJWT, db)

	return r
}
