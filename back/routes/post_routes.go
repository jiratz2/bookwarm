package routes

// import (
// 	"back/controllers"
// 	"back/middleware"

// 	"github.com/gin-gonic/gin"
// )

// func PostRoutes(router *gin.Engine) {
// 	post := router.Group("/api/post")
// 	{
// 		// GET route - no auth needed for reading posts
// 		post.GET("/", controllers.GetPostsByClub)
		
// 		// Protected routes - apply middleware to specific routes
// 		post.POST("/", middleware.JWTAuthMiddleware(), controllers.CreatePost)
// 		post.DELETE("/:id", middleware.JWTAuthMiddleware(), controllers.DeletePost)
// 		post.PUT("/:id/like", middleware.JWTAuthMiddleware(), controllers.ToggleLikePost)
// 	}
// }