package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine) {
	auth := router.Group("/api/auth")
	{
		auth.POST("/login", controllers.Login)
		auth.POST("/register", controllers.Register)
		auth.GET("/profile", middleware.JWTAuthMiddleware(), controllers.Profile) //ตอน test อย่าลืมใส่ token header
		auth.PUT("/profile", middleware.JWTAuthMiddleware(), controllers.UpdateProfile)
		auth.GET("/me", middleware.JWTAuthMiddleware(), controllers.GetMe)
	}

	// Add new route for getting other users' profiles
	user := router.Group("/api/user")
	{
		user.GET("/:id", middleware.JWTAuthMiddleware(), controllers.GetUserProfile)
	}
}
