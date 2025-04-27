package routes

import (
	"back/controllers"

	"github.com/gin-gonic/gin"
)

func AuthorRoutes(router *gin.Engine){
	authors := router.Group("/api/authors")
	{
		authors.GET("/", controllers.GetAllAuthor)
		authors.POST("/",controllers.CreateAuthor)
		authors.PUT("/:id", controllers.UpdateAuthor)
		authors.DELETE("/:id", controllers.DeleteAuthor)
	}
}