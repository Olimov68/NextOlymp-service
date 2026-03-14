package saroutes

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/middleware"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"

	saadmins "github.com/nextolympservice/go-backend/internal/superadmin/admins"
	saaudit "github.com/nextolympservice/go-backend/internal/superadmin/audit"
	sacerts "github.com/nextolympservice/go-backend/internal/superadmin/certificates"
	sadashboard "github.com/nextolympservice/go-backend/internal/superadmin/dashboard"
	safeedback "github.com/nextolympservice/go-backend/internal/superadmin/feedback"
	samocktests "github.com/nextolympservice/go-backend/internal/superadmin/mocktests"
	sanews "github.com/nextolympservice/go-backend/internal/superadmin/news"
	saolympiads "github.com/nextolympservice/go-backend/internal/superadmin/olympiads"
	sapayments "github.com/nextolympservice/go-backend/internal/superadmin/payments"
	saperms "github.com/nextolympservice/go-backend/internal/superadmin/permissions"
	sapromos "github.com/nextolympservice/go-backend/internal/superadmin/promocodes"
	saquestions "github.com/nextolympservice/go-backend/internal/superadmin/questions"
	saresults "github.com/nextolympservice/go-backend/internal/superadmin/results"
	sasecurity "github.com/nextolympservice/go-backend/internal/superadmin/security"
	sasettings "github.com/nextolympservice/go-backend/internal/superadmin/settings"
	satemplates "github.com/nextolympservice/go-backend/internal/superadmin/templates"
	sausers "github.com/nextolympservice/go-backend/internal/superadmin/users"
)

// Register — superadmin routelarni ro'yxatdan o'tkazadi
func Register(api *gin.RouterGroup, panelJWT *utils.PanelJWTManager, db *gorm.DB) {
	// Handlers
	dashHandler := sadashboard.NewHandler(db)
	adminsHandler := saadmins.NewHandler(db)
	usersHandler := sausers.NewHandler(db)
	olympiadsHandler := saolympiads.NewHandler(db)
	mockTestsHandler := samocktests.NewHandler(db)
	questionsHandler := saquestions.NewHandler(db)
	resultsHandler := saresults.NewHandler(db)
	newsHandler := sanews.NewHandler(db)
	certsHandler := sacerts.NewHandler(db)
	templatesHandler := satemplates.NewHandler(db)
	feedbackHandler := safeedback.NewHandler(db)
	paymentsHandler := sapayments.NewHandler(db)
	permsHandler := saperms.NewHandler(db)
	securityHandler := sasecurity.NewHandler(db)
	auditHandler := saaudit.NewHandler(db)
	settingsHandler := sasettings.NewHandler(db)
	promosHandler := sapromos.NewHandler(db)

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
			uG.GET("/:id", usersHandler.GetByID)
			uG.PATCH("/:id/block", usersHandler.Block)
			uG.PATCH("/:id/unblock", usersHandler.Unblock)
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
		}

		// Mock tests management
		mG := sa.Group("/mock-tests")
		{
			mG.GET("", mockTestsHandler.List)
			mG.POST("", mockTestsHandler.Create)
			mG.GET("/:id", mockTestsHandler.GetByID)
			mG.PUT("/:id", mockTestsHandler.Update)
			mG.DELETE("/:id", mockTestsHandler.Delete)
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

		// Feedback management
		fG := sa.Group("/feedback")
		{
			fG.GET("", feedbackHandler.List)
			fG.GET("/:id", feedbackHandler.GetByID)
			fG.PUT("/:id/reply", feedbackHandler.Reply)
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
	}
}
