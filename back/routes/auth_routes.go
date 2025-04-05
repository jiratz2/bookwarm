package routes

import (
	"back/controllers"
	"back/middleware"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine) {
	auth := router.Group("/api")
	{
		auth.POST("/login", controllers.Login)
		auth.POST("/register", controllers.Register)
		auth.GET("/profile", middleware.JWTAuthMiddleware(), controllers.Profile)
	}
}