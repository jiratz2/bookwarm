package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func ClubRoutes(router *gin.Engine){
	club := router.Group("/api/club")
	{
		club.GET("/", controllers.GetAllClubs)
		club.GET("/:id", controllers.GetClubByID)
		club.Use(middleware.JWTAuthMiddleware()).POST("/", controllers.CreateClub)
		club.Use(middleware.JWTAuthMiddleware()).POST("/:id/join", controllers.JoinClub)
		club.Use(middleware.JWTAuthMiddleware()).POST("/:id/leave", controllers.LeaveClub)
		club.Use(middleware.JWTAuthMiddleware()).PUT("/:id", controllers.UpdateClub)
		club.Use(middleware.JWTAuthMiddleware()).DELETE("/:id", controllers.DeleteClub)
	}
}