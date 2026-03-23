package saroutes

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/middleware"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"

	"github.com/nextolympservice/go-backend/internal/certgen"
	"github.com/nextolympservice/go-backend/internal/chat"

	adminverifications "github.com/nextolympservice/go-backend/internal/admin/verifications"

	panelupload "github.com/nextolympservice/go-backend/internal/panel/upload"
	saadmins "github.com/nextolympservice/go-backend/internal/superadmin/admins"
	saaudit "github.com/nextolympservice/go-backend/internal/superadmin/audit"
	sacerts "github.com/nextolympservice/go-backend/internal/superadmin/certificates"
	sadashboard "github.com/nextolympservice/go-backend/internal/superadmin/dashboard"
samocktests "github.com/nextolympservice/go-backend/internal/superadmin/mocktests"
	sanews "github.com/nextolympservice/go-backend/internal/superadmin/news"
	saolympiads "github.com/nextolympservice/go-backend/internal/superadmin/olympiads"
	sapayments "github.com/nextolympservice/go-backend/internal/superadmin/payments"
	saperms "github.com/nextolympservice/go-backend/internal/superadmin/permissions"
	sapromos "github.com/nextolympservice/go-backend/internal/superadmin/promocodes"
	saquestions "github.com/nextolympservice/go-backend/internal/superadmin/questions"
	saresults "github.com/nextolympservice/go-backend/internal/superadmin/results"
	sasecurity "github.com/nextolympservice/go-backend/internal/superadmin/security"
	saanticheat "github.com/nextolympservice/go-backend/internal/superadmin/anticheat"
	sasettings "github.com/nextolympservice/go-backend/internal/superadmin/settings"
	satemplates "github.com/nextolympservice/go-backend/internal/superadmin/templates"
	sausers "github.com/nextolympservice/go-backend/internal/superadmin/users"
)

// Register — superadmin routelarni ro'yxatdan o'tkazadi
func Register(api *gin.RouterGroup, panelJWT *utils.PanelJWTManager, db *gorm.DB, cfg *config.Config, chatHandler *chat.Handler) {
	// Handlers
	dashHandler := sadashboard.NewHandler(db)
	adminsHandler := saadmins.NewHandler(db)
	usersHandler := sausers.NewHandler(db)
	olympiadsHandler := saolympiads.NewHandler(db)
	mockTestsHandler := samocktests.NewHandler(db)
	questionsHandler := saquestions.NewHandler(db)
	resultsHandler := saresults.NewHandler(db)
	newsHandler := sanews.NewHandler(db)
	certGenerator := certgen.NewCertGenerator(
		cfg.Upload.Dir,
		"https://nextolymp.uz/verify-certificate",
		"assets/fonts",
		db,
	)
	certsHandler := sacerts.NewHandler(db, certGenerator, cfg.Upload.Dir)
	templatesHandler := satemplates.NewHandler(db)
paymentsHandler := sapayments.NewHandler(db)
	permsHandler := saperms.NewHandler(db)
	securityHandler := sasecurity.NewHandler(db)
	auditHandler := saaudit.NewHandler(db)
	settingsHandler := sasettings.NewHandler(db)
	promosHandler := sapromos.NewHandler(db)
	anticheatHandler := saanticheat.NewHandler(db)
	verificationsHandler := adminverifications.NewHandler(db)
	uploadHandler := panelupload.NewHandler(cfg)

	// Superadmin group
	sa := api.Group("/superadmin")
	sa.Use(middleware.PanelAuthRequired(panelJWT, db))
	sa.Use(middleware.SuperAdminOnly())
	{
		// Dashboard
		sa.GET("/dashboard", dashHandler.Stats)

		// Admins management
		adG := sa.Group("/admins")
		{
			adG.GET("", adminsHandler.List)
			adG.POST("", adminsHandler.Create)
			adG.GET("/:id", adminsHandler.GetByID)
			adG.PUT("/:id", adminsHandler.Update)
			adG.DELETE("/:id", adminsHandler.Delete)
			adG.PATCH("/:id/block", adminsHandler.Block)
			adG.PATCH("/:id/unblock", adminsHandler.Unblock)
		}

		// Users management
		uG := sa.Group("/users")
		{
			uG.GET("", usersHandler.List)
			uG.POST("", usersHandler.Create)
			uG.GET("/:id", usersHandler.GetByID)
			uG.PATCH("/:id/block", usersHandler.Block)
			uG.PATCH("/:id/unblock", usersHandler.Unblock)
			uG.PATCH("/:id/verify", usersHandler.Verify)
			uG.DELETE("/:id", usersHandler.Delete)
		}

		// Olympiads management
		oG := sa.Group("/olympiads")
		{
			oG.GET("", olympiadsHandler.List)
			oG.POST("", olympiadsHandler.Create)
			oG.GET("/:id", olympiadsHandler.GetByID)
			oG.PUT("/:id", olympiadsHandler.Update)
			oG.DELETE("/:id", olympiadsHandler.Delete)

			// Sub-resource endpoints
			oG.GET("/:id/registrations", olympiadsHandler.ListRegistrations)
			oG.GET("/:id/participants", olympiadsHandler.ListParticipants)
			oG.GET("/:id/results", olympiadsHandler.ListResults)
			oG.POST("/:id/results/:result_id/approve", olympiadsHandler.ApproveResult)
			oG.POST("/:id/duplicate", olympiadsHandler.Duplicate)
			oG.PATCH("/:id/publish", olympiadsHandler.Publish)
			oG.PATCH("/:id/unpublish", olympiadsHandler.Unpublish)
			oG.PATCH("/:id/toggle-registration", olympiadsHandler.ToggleRegistration)
		}

		// Mock tests management
		mG := sa.Group("/mock-tests")
		{
			mG.GET("", mockTestsHandler.List)
			mG.POST("", mockTestsHandler.Create)
			mG.GET("/:id", mockTestsHandler.GetByID)
			mG.PUT("/:id", mockTestsHandler.Update)
			mG.DELETE("/:id", mockTestsHandler.Delete)

			// Sub-resource endpoints
			mG.GET("/:id/registrations", mockTestsHandler.ListRegistrations)
			mG.GET("/:id/participants", mockTestsHandler.ListParticipants)
			mG.GET("/:id/results", mockTestsHandler.ListResults)
			mG.POST("/:id/results/:result_id/approve", mockTestsHandler.ApproveResult)
			mG.POST("/:id/duplicate", mockTestsHandler.Duplicate)
			mG.PATCH("/:id/publish", mockTestsHandler.Publish)
			mG.PATCH("/:id/unpublish", mockTestsHandler.Unpublish)
		}

		// Questions management
		qG := sa.Group("/questions")
		{
			qG.GET("", questionsHandler.List)
			qG.POST("", questionsHandler.Create)
			qG.POST("/bulk", questionsHandler.BulkCreate)
			qG.GET("/by-source", questionsHandler.GetBySource)
			qG.GET("/:id", questionsHandler.GetByID)
			qG.PUT("/:id", questionsHandler.Update)
			qG.DELETE("/:id", questionsHandler.Delete)
		}

		// Results overview
		rG := sa.Group("/results")
		{
			rG.GET("", resultsHandler.List)
			rG.GET("/:id", resultsHandler.GetByID)
			rG.GET("/olympiad/:olympiad_id/ranking", resultsHandler.GetOlympiadRanking)
		}

		// News / Announcements management
		nG := sa.Group("/news")
		{
			nG.GET("", newsHandler.List)
			nG.POST("", newsHandler.Create)
			nG.GET("/:id", newsHandler.GetByID)
			nG.PUT("/:id", newsHandler.Update)
			nG.DELETE("/:id", newsHandler.Delete)
		}

		// Certificates management
		cG := sa.Group("/certificates")
		{
			cG.GET("", certsHandler.List)
			cG.POST("", certsHandler.Create)
			cG.GET("/:id", certsHandler.GetByID)
			cG.PUT("/:id", certsHandler.Update)
			cG.POST("/:id/regenerate", certsHandler.Regenerate)
			cG.POST("/:id/revoke", certsHandler.Revoke)
			cG.GET("/:id/download", certsHandler.Download)
		}

		// Certificate templates
		tG := sa.Group("/certificate-templates")
		{
			tG.GET("", templatesHandler.List)
			tG.POST("", templatesHandler.Create)
			tG.GET("/:id", templatesHandler.GetByID)
			tG.PUT("/:id", templatesHandler.Update)
			tG.DELETE("/:id", templatesHandler.Delete)
		}

		// Payments management (promo-codes ham shu ichida)
		pG := sa.Group("/payments")
		{
			pG.GET("", paymentsHandler.List)
			pG.GET("/stats", paymentsHandler.Stats)
			pG.GET("/:id", paymentsHandler.GetByID)
			pG.PATCH("/:id/status", paymentsHandler.UpdateStatus)
			pG.POST("/:id/approve", paymentsHandler.Approve)
			pG.POST("/:id/refund", paymentsHandler.Refund)
			pG.POST("/manual", paymentsHandler.CreateManual)

			// Promo codes — To'lovlar bo'limi ichida
			pcG := pG.Group("/promo-codes")
			{
				pcG.GET("", promosHandler.List)
				pcG.POST("", promosHandler.Create)
				pcG.GET("/stats", promosHandler.Stats)
				pcG.GET("/:id", promosHandler.GetByID)
				pcG.PUT("/:id", promosHandler.Update)
				pcG.DELETE("/:id", promosHandler.Delete)
				pcG.PATCH("/:id/toggle", promosHandler.ToggleStatus)
				pcG.GET("/:id/usages", promosHandler.GetUsages)
			}
		}

		// Permissions management
		permG := sa.Group("/permissions")
		{
			permG.GET("", permsHandler.ListPermissions)
			permG.POST("/seed", permsHandler.SeedDefaults)
			permG.GET("/staff/:staff_id", permsHandler.GetStaffPermissions)
			permG.PUT("/staff/:staff_id", permsHandler.AssignPermissions)
		}

		// Security settings
		secG := sa.Group("/security")
		{
			secG.GET("/settings", securityHandler.GetSettings)
			secG.PUT("/settings", securityHandler.UpdateSettings)
		}

		// Audit logs
		sa.GET("/audit-logs", auditHandler.List)

		// Global settings
		sG := sa.Group("/settings")
		{
			sG.GET("", settingsHandler.GetAll)
			sG.PUT("", settingsHandler.Update)
		}

		// Verifications
		vG := sa.Group("/verifications")
		{
			vG.GET("", verificationsHandler.List)
			vG.GET("/:id", verificationsHandler.GetByID)
			vG.POST("/:id/approve", verificationsHandler.Approve)
			vG.POST("/:id/reject", verificationsHandler.Reject)
			vG.POST("/user/:user_id/approve", verificationsHandler.ApproveByUserID)
			vG.POST("/user/:user_id/reject", verificationsHandler.RejectByUserID)
		}

		// Upload
		sa.POST("/upload/image", uploadHandler.UploadImage)

		// Anti-cheat violations
		acG := sa.Group("/anticheat")
		{
			acG.GET("/violations", anticheatHandler.List)
			acG.GET("/violations/stats", anticheatHandler.Stats)
		}

		// Chat moderation
		chatG := sa.Group("/chat")
		{
			chatG.GET("/messages", chatHandler.GetMessages)
			chatG.POST("/messages", chatHandler.AdminSendMessage)
			chatG.DELETE("/messages/:id", chatHandler.AdminDeleteMessage)
			chatG.POST("/ban/:user_id", chatHandler.AdminBanUser)
			chatG.POST("/unban/:user_id", chatHandler.AdminUnbanUser)
			chatG.POST("/toggle", chatHandler.AdminToggleChat)
			chatG.GET("/bans", chatHandler.AdminGetBannedUsers)
			chatG.GET("/online", chatHandler.GetOnlineCount)
			chatG.GET("/settings", chatHandler.AdminGetSettings)
			chatG.PUT("/settings", chatHandler.AdminUpdateSettings)
			chatG.GET("/moderation-logs", chatHandler.AdminGetModerationLogs)
		}
	}
}
