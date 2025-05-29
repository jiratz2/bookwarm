package routes

import (
	"back/controllers"
	"back/middleware"
	"github.com/gin-gonic/gin"
)

func ReplyRoutes(router *gin.Engine) {
	reply := router.Group("/api/reply")
	{
		reply.POST("/post/:postId/reply", middleware.JWTAuthMiddleware(), controllers.CreateReply)
		reply.GET("/post/:postId/replies", controllers.GetRepliesByPost)
		reply.PUT("/:replyId/like", middleware.JWTAuthMiddleware(), controllers.LikeReply)
	}
}
