package controllers

import (
	"back/config"
	"back/models"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateReply
func CreateReply(c *gin.Context) {
	postIDHex := c.Param("postId")
	postID, err := primitive.ObjectIDFromHex(postIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var input struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	reply := models.Reply{
		ID:        primitive.NewObjectID(),
		PostID:    postID,
		UserID:    userID,
		Content:   input.Content,
		Likes:     []primitive.ObjectID{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	collection := config.DB.Database("bookwarm").Collection("replies")
	_, err = collection.InsertOne(context.TODO(), reply)
	if err != nil {
		log.Println("❌ DB insert error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating reply"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Reply created", "reply": reply})
}

// GetRepliesByPost
func GetRepliesByPost(c *gin.Context) {
	postIDHex := c.Param("postId")
	postID, err := primitive.ObjectIDFromHex(postIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("replies")

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"post_id": postID}}},
		bson.D{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":               1,
			"post_id":           1,
			"user_id":           1,
			"content":           1,
			"likes":             1,
			"created_at":        1,
			"updated_at":        1,
			"user_display_name": "$user.displayname",
			"user_profile_image": "$user.profile_img_url",
			"user_username":     "$user.username",
		}}},
		bson.D{{Key: "$sort", Value: bson.M{"created_at": 1}}},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching replies"})
		return
	}
	defer cursor.Close(context.TODO())

	var replies []bson.M
	if err := cursor.All(context.TODO(), &replies); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding replies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"replies": replies})
}

// Like/Unlike Reply
func LikeReply(c *gin.Context) {
	replyIDHex := c.Param("replyId")
	replyID, err := primitive.ObjectIDFromHex(replyIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID"})
		return
	}

	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("replies")
	var reply models.Reply
	err = collection.FindOne(context.TODO(), bson.M{"_id": replyID}).Decode(&reply)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reply not found"})
		return
	}

	liked := false
	for _, id := range reply.Likes {
		if id == userID {
			liked = true
			break
		}
	}

	var update bson.M
	var msg string
	if liked {
		// Unlike
		update = bson.M{"$pull": bson.M{"likes": userID}}
		msg = "Unliked reply"
	} else {
		// Like
		update = bson.M{"$addToSet": bson.M{"likes": userID}}
		msg = "Liked reply"
	}

	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": replyID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating like"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": msg})
}

// Delete Reply
func DeleteReply(c *gin.Context) {
	replyIDHex := c.Param("replyId")
	replyID, err := primitive.ObjectIDFromHex(replyIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID"})
		return
	}

	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("replies")
	var reply models.Reply
	err = collection.FindOne(context.TODO(), bson.M{"_id": replyID}).Decode(&reply)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reply not found"})
		return
	}

	if reply.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the owner of this reply"})
		return
	}

	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": replyID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reply deleted successfully"})
}
