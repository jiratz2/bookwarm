package routes

import (
	"back/controllers"

	"github.com/gin-gonic/gin"
)

func BooksRoutes(router *gin.Engine){
	book := router.Group("/api/books")
	{
		book.GET("/", controllers.GetAllBooks)
		book.POST("/",controllers.CreateBook)
		book.GET("/:id", controllers.GetBookByID)
		book.PUT("/:id", controllers.UpdateBook)
		book.DELETE("/:id", controllers.DeleteBook)
		book.GET("/search", controllers.SearchBooks)
	}
}