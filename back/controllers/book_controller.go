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

func CreateBook(c *gin.Context){
	var input models.Book
	if err:= c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	c.JSON(http.StatusOK, input)
}

func GetAllBooks(c *gin.Context){
	collection := config.DB.Database("bookwarm").Collection("books")
	cursor, err := collection.Find(context.TODO(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}

	defer cursor.Close(context.TODO())

	var books []models.Book
	for cursor.Next(context.TODO()){
		var book models.Book
		if err := cursor.Decode(&book); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode book"})
			return
		}
		books = append(books, book)
	}
	c.JSON(http.StatusOK, books)
}

func GetBookByID(c *gin.Context){
	idParam := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	collection := config.DB.Database("bookwarm").Collection("books")
	err = collection.FindOne(context.TODO(), bson.M{"_id": bookID}).Decode(&book)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}
	c.JSON(http.StatusOK, book)
}

func UpdateBook(c *gin.Context){
	idPaaram := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idPaaram)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var input models.Book
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.UpdatedAt = time.Now()
	update := bson.M{
		"$set": bson.M{
			"title" : input.Title,
			"description": input.Description,
			"authorId": input.AuthorID,
			"seriesId": input.SeriesID,
			"categoryId": input.CategoryID,
			"genres": input.Genres,
			"tagIds": input.TagIDs,
			"publishYear": input.PublishYear,
			"pageCount": input.PageCount,
			"rating": input.Rating,
			"updatedAt": input.UpdatedAt,
		},
	}

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": bookID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book updated successfully"})
}

func DeleteBook(c *gin.Context){
	idParam := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})

}