package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func ClubRoutes(router *gin.Engine){
	club := router.Group("/api/club")
	{
		// 🌍 Public routes - ทุกคนเข้าได้ (ไม่ต้อง auth)
		club.GET("/", controllers.GetAllClubs) // ดูคลับทั้งหมด
		club.GET("/:id", controllers.GetClubByID) // ดูคลับตาม ID
		club.GET("/recommended", controllers.GetRecommendedClubs) // ดูคลับแนะนำ
		
		// 🔒 Protected routes - ต้อง login และเป็นสมาชิก
		club.Use(middleware.JWTAuthMiddleware()).POST("/", controllers.CreateClub)
		club.Use(middleware.JWTAuthMiddleware()).POST("/:id/join", controllers.JoinClub)
		club.Use(middleware.JWTAuthMiddleware()).POST("/:id/leave", controllers.LeaveClub)
		club.Use(middleware.JWTAuthMiddleware()).PUT("/:id", controllers.UpdateClub)
		club.Use(middleware.JWTAuthMiddleware()).DELETE("/:id", controllers.DeleteClub)
		club.Use(middleware.JWTAuthMiddleware()).GET("/user", controllers.GetClubsByUser)
		club.Use(middleware.JWTAuthMiddleware()).GET("/:id/check-membership", controllers.CheckMembership)
	}
}