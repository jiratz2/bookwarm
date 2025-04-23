package routes

import (
	"back/controllers"

	"github.com/gin-gonic/gin"
)

func AuthorRoutes(router *gin.Engine){
	category := router.Group("/api/authors")
	{
		category.GET("/", controllers.GetAllAuthor)
		category.POST("/",controllers.CreateAuthor)
		category.PUT("/:id", controllers.UpdateAuthor)
		category.DELETE("/:id", controllers.DeleteAuthor)
	}
}