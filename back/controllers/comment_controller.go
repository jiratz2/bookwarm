package controllers
import (
	"back/config"
	"back/models"
	"context"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateComment(c *gin.Context) {
	var comment models.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	comment.ID = primitive.NewObjectID()
	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()

	collection := config.DB.Database("bookwarm").Collection("comment")
	_, err := collection.InsertOne(context.TODO(), comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating comment"})
		return
	}
	c.JSON(http.StatusCreated, comment)
}

func GetCommentsByPost(c *gin.Context) {
	postIDHex := c.Param("postId")
	postID, _ := primitive.ObjectIDFromHex(postIDHex)

	collection := config.DB.Database("bookwarm").Collection("comment")
	cursor, err := collection.Find(context.TODO(), bson.M{"post_id": postID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching comments"})
		return
	}
	var comments []models.Comment
	if err := cursor.All(context.TODO(), &comments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func ToggleLikeComment(c *gin.Context) {
	commentID, _ := primitive.ObjectIDFromHex(c.Param("id"))
	userID := c.MustGet("userId").(primitive.ObjectID)

	collection := config.DB.Database("bookwarm").Collection("comment")
	var comment models.Comment
	err := collection.FindOne(context.TODO(), bson.M{"_id": commentID}).Decode(&comment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	liked := false
	for _, id := range comment.Likes {
		if id == userID {
			liked = true
			break
		}
	}

	var update bson.M
	if liked {
		update = bson.M{"$pull": bson.M{"likes": userID}}
	} else {
		update = bson.M{"$addToSet": bson.M{"likes": userID}}
	}

	_, err = collection.UpdateByID(context.TODO(), commentID, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update like"})
		return
	}

	action := "liked"
	if liked {
		action = "unliked"
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment " + action})
}



func DeleteComment(c *gin.Context) {
	commentIDHex := c.Param("id")
	commentID, _ := primitive.ObjectIDFromHex(commentIDHex)

	userID := c.MustGet("userId").(primitive.ObjectID)

	collection := config.DB.Database("bookwarm").Collection("comment")
	var comment models.Comment
	err := collection.FindOne(context.TODO(), bson.M{"_id": commentID}).Decode(&comment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the owner"})
		return
	}

	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": commentID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting comment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}
