package controllers

import(
	"back/models"
	"context"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"back/config"
)

func CreatePost(c *gin.Context) {
	var post Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	post.UserID = userObjID
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()
	post.Likes = []primitive.ObjectID{}

	result, err := postCollection.InsertOne(context.TODO(), post)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": result.InsertedID})
}