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

func CreateAuthor(c *gin.Context){
	var input models.Author
	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	collection := config.DB.Database("bookwarm").Collection("author")

	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Author created successfully"})
}

func GetAllAuthor(c *gin.Context){
	collection := config.DB.Database("bookwarm").Collection("author")
	cursor, err := collection.Find(context.TODO(),bson.D{})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer cursor.Close(context.TODO())

	var authors []models.Author
	for cursor.Next(context.TODO()){
		var author models.Author
		if err := cursor.Decode(&author); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		authors = append(authors, author)
	}
	c.JSON(http.StatusOK, authors)
}

func UpdateAuthor(c *gin.Context){
	authorID := c.Param("id")

	var input models.Author
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(authorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid author ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("author")
	update := bson.M{"$set":bson.M{"name": input.Name, "update_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objectID},update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update author"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Author updated successfully"})
}

func DeleteAuthor(c *gin.Context){
	authorID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(authorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid author ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("author")
	_, err = collection.DeleteOne(context.TODO(),bson.M{"_id":objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete author"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Author deleted successfully"})
}