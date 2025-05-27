package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func CommentRoutes(router *gin.Engine){
	comment := router.Group("/api/comment")
	{
		comment.GET("/", controllers.GetCommentsByPost)
		comment.Use(middleware.JWTAuthMiddleware()).POST("/", controllers.CreateComment)
		comment.Use(middleware.JWTAuthMiddleware()).DELETE("/:id", controllers.DeleteComment)
		comment.Use(middleware.JWTAuthMiddleware()).PUT("/:id/like", controllers.ToggleLikeComment)
	}
}