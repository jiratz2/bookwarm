package routes

import (
	"back/controllers"

	"github.com/gin-gonic/gin"
)

func CategoryRoutes(router *gin.Engine){
	category := router.Group("/api/categories")
	{
		category.GET("/", controllers.GetAllCategory)
		category.POST("/",controllers.CreateCategory)
		category.PUT("/:id", controllers.UpdateCategory)
		category.DELETE("/:id", controllers.DeleteCategory)
	}
}