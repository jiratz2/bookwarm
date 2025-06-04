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

// ฟังก์ชันตรวจสอบว่า user เป็นสมาชิกของ club หรือไม่
func isClubMember(userID, clubID primitive.ObjectID) bool {
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	
	filter := bson.M{
		"_id": clubID,
		"$or": []bson.M{
			{"members": userID},
			{"owner_id": userID},
		},
	}
	
	count, err := clubCollection.CountDocuments(context.TODO(), filter)
	if err != nil {
		log.Println("❌ Error checking club membership:", err)
		return false
	}
	
	return count > 0
}

func CreatePost(c *gin.Context) {
	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		log.Println("❌ BindJSON error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Debug: แสดงข้อมูลที่ได้รับ
	log.Printf("📝 Received post data: %+v", post)

	// เช็กและ fallback จาก query string ถ้า club_id ใน body เป็น zero
	if post.ClubID.IsZero() {
		clubIDHex := c.Query("clubId")
		if clubIDHex == "" {
			log.Println("❌ club_id missing from both body and query")
			c.JSON(http.StatusBadRequest, gin.H{"error": "club_id is required"})
			return
		}
		clubID, err := primitive.ObjectIDFromHex(clubIDHex)
		if err != nil {
			log.Println("❌ Invalid club_id in query:", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club_id"})
			return
		}
		post.ClubID = clubID
	}

	// ดึง user ID จาก context
	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		log.Println("❌ Invalid userID:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// ตรวจสอบว่าเป็นสมาชิกของ club หรือไม่
	if !isClubMember(userID, post.ClubID) {
		log.Printf("❌ User %s is not a member of club %s", userID, post.ClubID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this club"})
		return
	}

	// ตรวจสอบและแปลง book_id ถ้ามี
	if post.BookID != nil && !post.BookID.IsZero() {
		// ตรวจสอบว่าหนังสือมีอยู่จริงหรือไม่
		bookCollection := config.DB.Database("bookwarm").Collection("books")
		count, err := bookCollection.CountDocuments(context.TODO(), bson.M{"_id": post.BookID})
		if err != nil || count == 0 {
			log.Printf("❌ Book with ID %s not found", post.BookID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Selected book not found"})
			return
		}
	}

	// ตั้งค่าข้อมูลโพสต์
	post.ID = primitive.NewObjectID()
	post.UserID = userID
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()
	
	// Initialize likes array if nil
	if post.Likes == nil {
		post.Likes = []primitive.ObjectID{}
	}

	log.Printf("✅ Final post data before insert: %+v", post)

	collection := config.DB.Database("bookwarm").Collection("post")
	result, err := collection.InsertOne(context.TODO(), post)
	if err != nil {
		log.Println("❌ DB insert error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating post"})
		return
	}

	log.Println("✅ Post created with ID:", result.InsertedID)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post_id": result.InsertedID,
		"post": post,
	})
}

// แก้ไขใน GetPostsByClub function
func GetPostsByClub(c *gin.Context) {
	clubIDHex := c.Query("clubId")
	if clubIDHex == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "clubId is required"})
		return
	}
	
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clubId"})
		return
	}

	postCollection := config.DB.Database("bookwarm").Collection("post")

	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"club_id": clubID}}},

		// Join กับ users collection
		bson.D{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}}},

		// Join กับ books collection (optional)
		bson.D{{Key: "$lookup", Value: bson.M{
			"from":         "books",
			"localField":   "book_id",
			"foreignField": "_id",
			"as":           "book",
		}}},
		bson.D{{Key: "$unwind", Value: bson.M{"path": "$book", "preserveNullAndEmptyArrays": true}}},

		// Project ข้อมูลที่ต้องการ - เพิ่มข้อมูล user เพิ่มเติม
		bson.D{{Key: "$project", Value: bson.M{
			"_id":               1,
			"content":           1,
			"club_id":           1,
			"user_id":           1,
			"user_display_name": "$user.displayname",
			"user_profile_image": "$user.profile_img_url", // ใช้ field ตามโมเดล
			"user_username":     "$user.username",
			"user_email":        "$user.email",
			"book_id":           1,
			"book_title":        "$book.title",
			"book_author":       "$book.author",
			"likes":             1,
			"likes_count":       bson.M{"$size": bson.M{"$ifNull": []interface{}{"$likes", []interface{}{}}}},
			"created_at":        1,
			"updated_at":        1,
		}}},

		bson.D{{Key: "$sort", Value: bson.M{"created_at": -1}}},
	}

	cursor, err := postCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		log.Println("❌ Aggregation error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error aggregating posts"})
		return
	}

	var posts []bson.M
	if err := cursor.All(context.TODO(), &posts); err != nil {
		log.Println("❌ Cursor decode error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"count": len(posts),
	})
}

func ToggleLikePost(c *gin.Context) {
	postID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	
	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("post")
	var post models.Post
	err = collection.FindOne(context.TODO(), bson.M{"_id": postID}).Decode(&post)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// ตรวจสอบว่าเคยไลก์แล้วหรือยัง
	liked := false
	for _, id := range post.Likes {
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

	_, err = collection.UpdateByID(context.TODO(), postID, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update like"})
		return
	}

	message := "Post liked"
	if liked {
		message = "Post unliked"
	}
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func DeletePost(c *gin.Context) {
	postIDHex := c.Param("id")
	postID, err := primitive.ObjectIDFromHex(postIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("post")
	var post models.Post
	err = collection.FindOne(context.TODO(), bson.M{"_id": postID}).Decode(&post)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// ตรวจสอบว่าเป็นสมาชิกของ club หรือไม่
	if !isClubMember(userID, post.ClubID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this club"})
		return
	}

	// ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
	if post.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not the owner of this post"})
		return
	}

	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": postID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting post"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// GetRandomPosts ดึงโพสต์แบบสุ่ม
func GetRandomPosts(c *gin.Context) {
	postCollection := config.DB.Database("bookwarm").Collection("post")

	pipeline := mongo.Pipeline{
		// Join with users
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "users"},
			{Key: "localField", Value: "user_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "user"},
		}}},
		bson.D{{Key: "$unwind", Value: bson.D{
			{Key: "path", Value: "$user"},
			{Key: "preserveNullAndEmptyArrays", Value: true},
		}}},

		// Join with books (optional)
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "books"},
			{Key: "localField", Value: "book_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "book"},
		}}},
		bson.D{{Key: "$unwind", Value: bson.D{
			{Key: "path", Value: "$book"},
			{Key: "preserveNullAndEmptyArrays", Value: true},
		}}},

		// Join with clubs
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "clubs"},
			{Key: "localField", Value: "club_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "club"},
		}}},
		bson.D{{Key: "$unwind", Value: bson.D{
			{Key: "path", Value: "$club"},
			{Key: "preserveNullAndEmptyArrays", Value: true},
		}}},

		// Project required fields
		bson.D{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: 1},
			{Key: "content", Value: 1},
			{Key: "club_id", Value: 1},
			{Key: "user_id", Value: 1},
			{Key: "user_display_name", Value: "$user.displayname"},
			{Key: "user_profile_image", Value: "$user.profile_img_url"},
			{Key: "book_id", Value: 1},
			{Key: "book_title", Value: "$book.title"},
			{Key: "book_author", Value: "$book.author"},
			{Key: "likes", Value: 1},
			{Key: "likes_count", Value: bson.D{{Key: "$size", Value: bson.D{{Key: "$ifNull", Value: bson.A{"$likes", bson.A{}}}}}}},
			{Key: "created_at", Value: 1},
			{Key: "updated_at", Value: 1},
			{Key: "club_name", Value: "$club.name"},
		}}},

		// Randomly sample 10 posts
		bson.D{{Key: "$sample", Value: bson.D{
			{Key: "size", Value: 10},
		}}},
	}

	log.Println("Executing aggregation pipeline for random posts...")
	cursor, err := postCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		log.Println("❌ Aggregation error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error aggregating posts"})
		return
	}

	var posts []bson.M
	if err := cursor.All(context.TODO(), &posts); err != nil {
		log.Println("❌ Cursor decode error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"count": len(posts),
	})
}