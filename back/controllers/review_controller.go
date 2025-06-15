package controllers

import (
	"back/config"
	"back/models"
	"context"
	"net/http"
	"time"
	"log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreateReview(c *gin.Context) {

	var input struct {
		BookID  string `json:"book_id" binding:"required"`
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("BindJSON error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	bookID, err := primitive.ObjectIDFromHex(input.BookID)
	if err != nil {
		log.Printf("Invalid book ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	userRaw, exists := c.Get("user")
	if !exists {
		log.Printf("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)
	log.Printf("📧 User email: %s", email)

	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		log.Printf("User not found: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	log.Printf("👤 User found: %+v", user)


	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")

	filter := bson.M{"book_id": bookID, "reviewer_name": user.DisplayName}
	log.Printf("Checking existing review with filter: %+v", filter)
	count, err := reviewCollection.CountDocuments(context.TODO(), filter)
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	log.Printf("Found %d existing reviews", count)
	if count > 0 {
		log.Printf("User already reviewed this book")
		c.JSON(http.StatusBadRequest, gin.H{"error": "You have already reviewed this book"})
		return
	}

	bookCollection := config.DB.Database("bookwarm").Collection("books")
	bookCount, err := bookCollection.CountDocuments(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if bookCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	review := models.Review{
		ID:           primitive.NewObjectID(),
		BookID:       bookID,
		Rating:       input.Rating,
		Comment:      input.Comment,
		ReviewerName: user.DisplayName,
        ReviewProfilePic: user.ProfilePic,
		ReviewDate:   time.Now(),
	}

	insertResult, err := reviewCollection.InsertOne(context.TODO(), review)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save review"})
		return
	}

	createdReviewID := insertResult.InsertedID.(primitive.ObjectID)
	enrichedReview, err := GetReviewByID(createdReviewID)
	if err != nil {
		log.Printf("Failed to fetch enriched review: %v", err)
		c.JSON(http.StatusOK, gin.H{
			"message": "Review submitted successfully",
			"review": review,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Review submitted successfully",
		"review":  enrichedReview,
	})
}

func GetReviewByID(reviewID primitive.ObjectID) (bson.M, error) {
	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"_id": reviewID}}},
		bson.D{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "reviewer_name",
			"foreignField": "displayname",
			"as":           "user",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":               1,
			"book_id":           1,
			"rating":            1,
			"comment":           1,
			"reviewer_name":     1,
			"review_date":       1,
			"updated_at":        1,
			"user_display_name": "$user.displayname",
			"user_profile_pic":  "$user.profile_img_url",
			"user_username":     "$user.username",
			"user_email":        "$user.email",
		}}},
	}

	cursor, err := reviewCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var reviews []bson.M
	if err := cursor.All(context.TODO(), &reviews); err != nil {
		return nil, err
	}

	if len(reviews) == 0 {
		return nil, mongo.ErrNoDocuments
	}

	return reviews[0], nil
}

func GetAllReviews(c *gin.Context) {
	bookIDParam := c.Param("bookId")
	bookID, err := primitive.ObjectIDFromHex(bookIDParam)
	if err != nil {
		log.Printf("Invalid book ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")

	bookCollection := config.DB.Database("bookwarm").Collection("books")
	bookCount, err := bookCollection.CountDocuments(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		log.Printf("Error checking book existence: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if bookCount == 0 {
		log.Printf("Book not found with ID: %s", bookIDParam)
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"book_id": bookID}}},

		// Join กับ users collection
		bson.D{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "reviewer_name",
			"foreignField": "displayname",
			"as":           "user",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}}},

		// Project ข้อมูลที่ต้องการ
		bson.D{{Key: "$project", Value: bson.M{
			"_id":               1,
			"book_id":           1,
			"rating":            1,
			"comment":           1,
			"reviewer_name":     1,
			"review_date":       1,
			"updated_at":        1,
			"user_display_name": "$user.displayname",
			"user_profile_pic":  "$user.profile_img_url",
			"user_username":     "$user.username",
			"user_email":        "$user.email",
			"user_id":           "$user._id",
		}}},

		bson.D{{Key: "$sort", Value: bson.M{"review_date": -1}}},
	}

	log.Printf("Executing aggregation pipeline for book ID: %s", bookIDParam)
	cursor, err := reviewCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		log.Printf("Aggregation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer cursor.Close(context.TODO())

	var reviews []bson.M
	var totalRating int
	
	for cursor.Next(context.TODO()) {
		var review bson.M
		if err := cursor.Decode(&review); err != nil {
			log.Printf("Error decoding review: %v", err)
			continue
		}
		log.Printf("Review found: %+v", review)
		reviews = append(reviews, review)
		if rating, ok := review["rating"].(int32); ok {
			totalRating += int(rating)
		}
	}

	if err := cursor.Err(); err != nil {
		log.Printf(" Cursor error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing reviews"})
		return
	}

	// คำนวณค่าเฉลี่ย rating
	var average float64
	if len(reviews) > 0 {
		average = float64(totalRating) / float64(len(reviews))
	}

	log.Printf("Successfully fetched %d reviews for book ID: %s", len(reviews), bookIDParam)

	log.Printf("Reviews being sent to frontend (first 5): %+v", reviews[:min(len(reviews), 5)])

	c.JSON(http.StatusOK, gin.H{
		"reviews":        reviews,
		"average_rating": average,
		"total_reviews":  len(reviews),
	})
}

func UpdateReview(c *gin.Context) {
	reviewID, err := primitive.ObjectIDFromHex(c.Param("reviewId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var input struct {
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	if err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("reviews")

	var review models.Review
	if err := collection.FindOne(c, bson.M{"_id": reviewID}).Decode(&review); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	if review.ReviewerName != user.DisplayName {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"rating":     input.Rating,
			"comment":    input.Comment,
			"updated_at": time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	if err := collection.FindOneAndUpdate(c, bson.M{"_id": reviewID}, update, opts).Decode(&review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}
	enrichedReview, err := GetReviewByID(reviewID)
	if err != nil {
		log.Printf("Failed to fetch enriched review: %v", err)
		c.JSON(http.StatusOK, gin.H{"review": review})
		return
	}

	c.JSON(http.StatusOK, gin.H{"review": enrichedReview})
}

func DeleteReview(c *gin.Context) {
	reviewID, err := primitive.ObjectIDFromHex(c.Param("reviewId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	if err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("reviews")

	var review models.Review
	if err := collection.FindOne(c, bson.M{"_id": reviewID}).Decode(&review); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	if review.ReviewerName != user.DisplayName {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	_, err = collection.DeleteOne(c, bson.M{"_id": reviewID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func GetUserReviews(c *gin.Context) {
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	if err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")
	cursor, err := reviewCollection.Find(context.TODO(), bson.M{"reviewer_name": user.DisplayName})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer cursor.Close(context.TODO())

	var reviews []models.Review
	if err := cursor.All(context.TODO(), &reviews); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}
