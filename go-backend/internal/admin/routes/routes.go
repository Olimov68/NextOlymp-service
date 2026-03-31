package adminroutes

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/middleware"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"

	admincertificates "github.com/nextolympservice/go-backend/internal/admin/certificates"
	admindashboard "github.com/nextolympservice/go-backend/internal/admin/dashboard"
	adminverifications "github.com/nextolympservice/go-backend/internal/admin/verifications"
	adminnews "github.com/nextolympservice/go-backend/internal/admin/news"
	adminresults "github.com/nextolympservice/go-backend/internal/admin/results"
	admintests "github.com/nextolympservice/go-backend/internal/admin/tests"
	adminusers "github.com/nextolympservice/go-backend/internal/admin/users"
	"github.com/nextolympservice/go-backend/internal/chat"
	panelupload "github.com/nextolympservice/go-backend/internal/panel/upload"
)

// Register — admin routelarni ro'yxatdan o'tkazadi
func Register(api *gin.RouterGroup, panelJWT *utils.PanelJWTManager, db *gorm.DB, cfg *config.Config, chatHandler *chat.Handler) {
	// Handlers
	dashHandler := admindashboard.NewHandler(db)
	testsHandler := admintests.NewHandler(admintests.NewService(admintests.NewRepository(db)))
	usersHandler := adminusers.NewHandler(db)
	newsHandler := adminnews.NewHandler(db)
	certsHandler := admincertificates.NewHandler(db)
	resultsHandler := adminresults.NewResultsHandler(db)
	verificationsHandler := adminverifications.NewHandler(db)
	uploadHandler := panelupload.NewHandler(cfg)

	// Admin group
	admin := api.Group("/admin")
	admin.Use(middleware.PanelAuthRequired(panelJWT, db))
	admin.Use(middleware.AdminOnly())
	{
		// Dashboard
		admin.GET("/dashboard", dashHandler.Stats)

		// Olympiads
		og := admin.Group("/olympiads")
		{
			og.GET("", middleware.PermissionRequired(db, "olympiads.view"), testsHandler.ListOlympiads)
			og.POST("", middleware.PermissionRequired(db, "olympiads.create"), testsHandler.CreateOlympiad)
			og.GET("/:id", middleware.PermissionRequired(db, "olympiads.view"), testsHandler.GetOlympiad)
			og.PUT("/:id", middleware.PermissionRequired(db, "olympiads.update"), testsHandler.UpdateOlympiad)
			og.DELETE("/:id", middleware.PermissionRequired(db, "olympiads.delete"), testsHandler.DeleteOlympiad)
		}

		// Mock Tests
		mg := admin.Group("/mock-tests")
		{
			mg.GET("", middleware.PermissionRequired(db, "mock_tests.view"), testsHandler.ListMockTests)
			mg.POST("", middleware.PermissionRequired(db, "mock_tests.create"), testsHandler.CreateMockTest)
			mg.GET("/:id", middleware.PermissionRequired(db, "mock_tests.view"), testsHandler.GetMockTest)
			mg.PUT("/:id", middleware.PermissionRequired(db, "mock_tests.update"), testsHandler.UpdateMockTest)
			mg.DELETE("/:id", middleware.PermissionRequired(db, "mock_tests.delete"), testsHandler.DeleteMockTest)
		}

		// Results
		rg := admin.Group("/results")
		{
			rg.GET("", middleware.PermissionRequired(db, "results.view"), resultsHandler.List)
			rg.GET("/:id", middleware.PermissionRequired(db, "results.view"), resultsHandler.GetByID)
		}

		// Users
		ug := admin.Group("/users")
		{
			ug.GET("", middleware.PermissionRequired(db, "users.view"), usersHandler.List)
			ug.GET("/:id", middleware.PermissionRequired(db, "users.view"), usersHandler.GetByID)
			ug.PATCH("/:id/block", middleware.PermissionRequired(db, "users.block"), usersHandler.Block)
			ug.PATCH("/:id/unblock", middleware.PermissionRequired(db, "users.block"), usersHandler.Unblock)
			ug.DELETE("/:id", middleware.PermissionRequired(db, "users.delete"), usersHandler.Delete)
		}

		// News
		newsG := admin.Group("/news")
		{
			newsG.GET("", middleware.PermissionRequired(db, "news.view"), newsHandler.List)
			newsG.POST("", middleware.PermissionRequired(db, "news.create"), newsHandler.Create)
			newsG.GET("/:id", middleware.PermissionRequired(db, "news.view"), newsHandler.GetByID)
			newsG.PUT("/:id", middleware.PermissionRequired(db, "news.update"), newsHandler.Update)
			newsG.DELETE("/:id", middleware.PermissionRequired(db, "news.delete"), newsHandler.Delete)
		}

		// Certificates
		cerG := admin.Group("/certificates")
		{
			cerG.GET("", middleware.PermissionRequired(db, "certificates.view"), certsHandler.List)
			cerG.GET("/:id", middleware.PermissionRequired(db, "certificates.view"), certsHandler.GetByID)
		}

		// Verifications
		vG := admin.Group("/verifications")
		{
			vG.GET("", middleware.PermissionRequired(db, "verifications.view"), verificationsHandler.List)
			vG.GET("/:id", middleware.PermissionRequired(db, "verifications.view"), verificationsHandler.GetByID)
			vG.POST("/:id/approve", middleware.PermissionRequired(db, "verifications.manage"), verificationsHandler.Approve)
			vG.POST("/:id/reject", middleware.PermissionRequired(db, "verifications.manage"), verificationsHandler.Reject)
			vG.POST("/user/:user_id/approve", middleware.PermissionRequired(db, "verifications.manage"), verificationsHandler.ApproveByUserID)
			vG.POST("/user/:user_id/reject", middleware.PermissionRequired(db, "verifications.manage"), verificationsHandler.RejectByUserID)
		}

		// Chat Moderation
		chatG := admin.Group("/chat")
		{
			chatG.GET("/messages", middleware.PermissionRequired(db, "chat.view"), chatHandler.GetMessages)
			chatG.POST("/messages", middleware.PermissionRequired(db, "chat.moderate"), chatHandler.AdminSendMessage)
			chatG.DELETE("/messages/:id", middleware.PermissionRequired(db, "chat.moderate"), chatHandler.AdminDeleteMessage)
			chatG.POST("/ban/:user_id", middleware.PermissionRequired(db, "chat.moderate"), chatHandler.AdminBanUser)
			chatG.POST("/unban/:user_id", middleware.PermissionRequired(db, "chat.moderate"), chatHandler.AdminUnbanUser)
			chatG.POST("/toggle", middleware.PermissionRequired(db, "chat.manage"), chatHandler.AdminToggleChat)
			chatG.GET("/bans", middleware.PermissionRequired(db, "chat.view"), chatHandler.AdminGetBannedUsers)
			chatG.GET("/online", middleware.PermissionRequired(db, "chat.view"), chatHandler.GetOnlineCount)
			chatG.GET("/settings", middleware.PermissionRequired(db, "chat.view"), chatHandler.AdminGetSettings)
			chatG.PUT("/settings", middleware.PermissionRequired(db, "chat.manage"), chatHandler.AdminUpdateSettings)
			chatG.GET("/moderation-logs", middleware.PermissionRequired(db, "chat.view"), chatHandler.AdminGetModerationLogs)
		}

		// Upload
		admin.POST("/upload/image", uploadHandler.UploadImage)
	}
}
