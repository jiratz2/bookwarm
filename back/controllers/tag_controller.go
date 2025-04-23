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

func CreateTag(c *gin.Context){
	var input models.Tag
	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	collection := config.DB.Database("bookwarm").Collection("tag")

	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag created successfully"})
}

func GetAllTag(c *gin.Context){
	collection := config.DB.Database("bookwarm").Collection("tag")
	cursor, err := collection.Find(context.TODO(),bson.D{})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer cursor.Close(context.TODO())

	var tags []models.Tag
	for cursor.Next(context.TODO()){
		var tag models.Tag
		if err := cursor.Decode(&tag); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		tags = append(tags, tag)
	}
	c.JSON(http.StatusOK, tags)
}

func UpdateTag(c *gin.Context){
	tagID := c.Param("id")

	var input models.Tag
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(tagID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("tag")
	update := bson.M{"$set":bson.M{"name": input.Name, "update_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objectID},update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tag"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tag updated successfully"})
}

func DeleteTag(c *gin.Context){
	tagID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(tagID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("tag")
	_, err = collection.DeleteOne(context.TODO(),bson.M{"_id":objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tag"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}