package adminroutes

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/middleware"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"

	admincertificates "github.com/nextolympservice/go-backend/internal/admin/certificates"
	admindashboard "github.com/nextolympservice/go-backend/internal/admin/dashboard"
	admindiscussion "github.com/nextolympservice/go-backend/internal/admin/discussion"
	adminfeedback "github.com/nextolympservice/go-backend/internal/admin/feedback"
	adminnews "github.com/nextolympservice/go-backend/internal/admin/news"
	admintests "github.com/nextolympservice/go-backend/internal/admin/tests"
	adminusers "github.com/nextolympservice/go-backend/internal/admin/users"
	panelupload "github.com/nextolympservice/go-backend/internal/panel/upload"
)

// Register — admin routelarni ro'yxatdan o'tkazadi
func Register(api *gin.RouterGroup, panelJWT *utils.PanelJWTManager, db *gorm.DB, cfg *config.Config) {
	// Handlers
	dashHandler := admindashboard.NewHandler(db)
	testsHandler := admintests.NewHandler(admintests.NewService(admintests.NewRepository(db)))
	usersHandler := adminusers.NewHandler(db)
	newsHandler := adminnews.NewHandler(db)
	certsHandler := admincertificates.NewHandler(db)
	feedbackHandler := adminfeedback.NewHandler(db)
	resultsHandler := adminfeedback.NewResultsHandler(db)
	discussionHandler := admindiscussion.NewHandler(admindiscussion.NewRepository(db))
	uploadHandler := panelupload.NewHandler(cfg)

	// Admin group
	admin := api.Group("/admin")
	admin.Use(middleware.PanelAuthRequired(panelJWT, db))
	admin.Use(middleware.AdminOnly())
	{
		// Dashboard - no specific permission, filtered internally
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
			ug.GET("/pending-verification", middleware.PermissionRequired(db, "users.view"), usersHandler.PendingVerification)
			ug.GET("/:id", middleware.PermissionRequired(db, "users.view"), usersHandler.GetByID)
			ug.PATCH("/:id/block", middleware.PermissionRequired(db, "users.block"), usersHandler.Block)
			ug.PATCH("/:id/unblock", middleware.PermissionRequired(db, "users.block"), usersHandler.Unblock)
			ug.PATCH("/:id/verify", middleware.PermissionRequired(db, "users.block"), usersHandler.Verify)
			ug.PATCH("/:id/reject", middleware.PermissionRequired(db, "users.block"), usersHandler.Reject)
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

		// Feedback
		fbG := admin.Group("/feedback")
		{
			fbG.GET("", middleware.PermissionRequired(db, "news.view"), feedbackHandler.List)
			fbG.GET("/:id", middleware.PermissionRequired(db, "news.view"), feedbackHandler.GetByID)
			fbG.PUT("/:id/reply", middleware.PermissionRequired(db, "news.update"), feedbackHandler.Reply)
		}

		// Discussion moderation
		discG := admin.Group("/discussion")
		{
			discG.GET("/messages", discussionHandler.ListMessages)
			discG.DELETE("/messages/:id", discussionHandler.DeleteMessage)
			discG.PATCH("/messages/:id/hide", discussionHandler.HideMessage)
			discG.PATCH("/messages/:id/unhide", discussionHandler.UnhideMessage)
			discG.GET("/users", discussionHandler.ListUsers)
			discG.PATCH("/users/:id/mute", discussionHandler.MuteUser)
			discG.PATCH("/users/:id/unmute", discussionHandler.UnmuteUser)
			discG.PATCH("/users/:id/block", discussionHandler.BlockUser)
			discG.PATCH("/users/:id/unblock", discussionHandler.UnblockUser)
		}

		// Upload
		admin.POST("/upload/image", uploadHandler.UploadImage)
	}
}
