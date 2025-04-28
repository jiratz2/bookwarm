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

func CreateGenre(c *gin.Context){
	var input models.Genre
	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	collection := config.DB.Database("bookwarm").Collection("genre")

	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Genre created successfully"})
}

func GetAllGenre(c *gin.Context){
	collection := config.DB.Database("bookwarm").Collection("genre")
	cursor, err := collection.Find(context.TODO(),bson.D{})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer cursor.Close(context.TODO())

	var genres []models.Genre
	for cursor.Next(context.TODO()){
		var genre models.Genre
		if err := cursor.Decode(&genre); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		genres = append(genres, genre)
	}
	c.JSON(http.StatusOK, genres)
}

func UpdateGenre(c *gin.Context){
	genreID := c.Param("id")

	var input models.Genre
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(genreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("genre")
	update := bson.M{"$set":bson.M{"name": input.Name, "update_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objectID},update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update genre"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Genre updated successfully"})
}

func DeleteGenre(c *gin.Context){
	genreID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(genreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("genre")
	_, err = collection.DeleteOne(context.TODO(),bson.M{"_id":objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete genre"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Genre deleted successfully"})
}