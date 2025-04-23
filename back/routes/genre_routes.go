package routes

import (
	"back/controllers"
	"github.com/gin-gonic/gin"
)
func GenreRoutes(router *gin.Engine){
	category := router.Group("/api/genres")
	{
		category.GET("/", controllers.GetAllGenre)
		category.POST("/",controllers.CreateGenre)
		category.PUT("/:id", controllers.UpdateGenre)
		category.DELETE("/:id", controllers.DeleteGenre)
	}
}