package routes

import(
	"back/controllers"
	"github.com/gin-gonic/gin"
)

func ReviewRoutes(router *gin.Engine){
	review := router.Group("/api/reviews")
	{
		review.POST("/", controllers.CreateReview)
		review.GET("/", controllers.GetAllReviews) //http://localhost:8080/api/reviews?book_id=
		review.DELETE("/:id", controllers.DeleteReview) //http://localhost:8080/api/reviews/:review_id
	}
}