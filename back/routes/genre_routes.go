package routes

import (
	"back/controllers"
	"github.com/gin-gonic/gin"
)
func GenreRoutes(router *gin.Engine){
	genres := router.Group("/api/genres")
	{
		genres.GET("/", controllers.GetAllGenre)
		genres.POST("/",controllers.CreateGenre)
		genres.PUT("/:id", controllers.UpdateGenre)
		genres.DELETE("/:id", controllers.DeleteGenre)
	}
}