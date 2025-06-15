package routes

import (
	"back/controllers"
	"back/middleware"
	"github.com/gin-gonic/gin"
)

func MarkRoutes(router *gin.Engine) {
	mark := router.Group("/api/marks")
	{
		mark.Use(middleware.JWTAuthMiddleware())
		mark.POST("/", controllers.CreateMark)          
		mark.GET("/user/:user_id", controllers.GetMarksByUser) 
		mark.GET("/user/:user_id/marks", controllers.GetMarksByUserID) 
		mark.GET("/:book_id", controllers.GetMarkByUserAndBook)
		mark.PUT("/:mark_id", controllers.UpdateMark)        
		mark.DELETE("/:mark_id", controllers.DeleteMark)    
	}
}
