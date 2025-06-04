package controllers

import (
	"back/config"
	"back/models"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"log"
)

// CreateClub สร้าง Club ใหม่

func CreateClub(c *gin.Context) {
	// Parse form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")

	// ตรวจสอบ required fields
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Club name is required"})
		return
	}

	// ดึงผู้ใช้
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// สร้าง club object
	club := models.Club{
		ID:          primitive.NewObjectID(),
		Name:        name,
		Description: description,
		OwnerID:     user.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Members:     []primitive.ObjectID{user.ID}, // เพิ่มตรงนี้
	}

	// รับไฟล์ภาพ (optional)
	file, header, err := c.Request.FormFile("cover_image")
	if err == nil {
		// มีรูปภาพ
		defer file.Close()

		// สร้าง path
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
		savePath := "uploads/" + filename

		// สร้างโฟลเดอร์ถ้ายังไม่มี
		os.MkdirAll("uploads", os.ModePerm)

		// บันทึกไฟล์
		out, err := os.Create(savePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		defer out.Close()
		io.Copy(out, file)

		club.CoverImage = "/uploads/" + filename

	} else {
		// ไม่มีรูปภาพ ใช้รูป default หรือเว้นว่าง
		club.CoverImage = "" // หรือ "/uploads/default.jpg"
	}

	// บันทึกข้อมูลคลับ
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	_, err = clubCollection.InsertOne(context.TODO(), club)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club created successfully", "id": club.ID})
}

func GetAllClubs(c *gin.Context) {
	collection := config.DB.Database("bookwarm").Collection("clubs")

	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clubs"})
		return
	}
	defer cursor.Close(context.TODO())

	var clubs []models.Club
	if err := cursor.All(context.TODO(), &clubs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode clubs"})
		return
	}

	// Debug: Print club data
	for i, club := range clubs {
		fmt.Printf("Club %d: Name=%s, CoverImage=%s\n", i, club.Name, club.CoverImage)
	}

	c.JSON(http.StatusOK, clubs)
}

// GetClubByID ดึง Club ตาม ID
func GetClubByID(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	userCollection := config.DB.Database("bookwarm").Collection("users")

	var club models.Club
	err = clubCollection.FindOne(context.TODO(), bson.M{"_id": clubID}).Decode(&club)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// ดึงชื่อเจ้าของจาก owner_id
	var owner models.User
	err = userCollection.FindOne(context.TODO(), bson.M{"_id": club.OwnerID}).Decode(&owner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get club owner"})
		return
	}

	// ส่งข้อมูล club + owner_display_name
	c.JSON(http.StatusOK, gin.H{
		"id":                 club.ID,
		"name":               club.Name,
		"description":        club.Description,
		"cover_image":        club.CoverImage,
		"owner_id":           club.OwnerID,
		"owner_display_name": owner.DisplayName,
		"members":            club.Members,
		"created_at":         club.CreatedAt,
		"updated_at":         club.UpdatedAt,
	})
}


func JoinClub(c *gin.Context) {
	clubIDHex := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	// ดึง email จาก JWT
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// อัปเดต club: เพิ่ม user.ID เข้า members ถ้ายังไม่มี
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	update := bson.M{
		"$addToSet": bson.M{"members": user.ID}, // ป้องกันซ้ำ
	}

	result, err := clubCollection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined club successfully"})
}

func LeaveClub(c *gin.Context) {
	clubIDHex := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	// ดึง email จาก JWT
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// ดึงข้อมูลคลับมาก่อน
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	var club models.Club
	err = clubCollection.FindOne(context.TODO(), bson.M{"_id": clubID}).Decode(&club)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// 🔐 เช็คว่า user เป็นเจ้าของคลับหรือไม่
	if club.OwnerID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Owner cannot leave their own club"})
		return
	}

	// ถ้าไม่ใช่เจ้าของ ก็ออกได้
	update := bson.M{
		"$pull": bson.M{"members": user.ID},
	}
	result, err := clubCollection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left club successfully"})
}

// UpdateClub แก้ไขข้อมูล Club
func UpdateClub(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")

	update := bson.M{
		"name":        name,
		"description": description,
		"updated_at":  time.Now(),
	}

	// เช็คว่ามีภาพไหม
	file, header, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer file.Close()

		// สร้าง path
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
		savePath := "uploads/" + filename
		os.MkdirAll("uploads", os.ModePerm)

		out, err := os.Create(savePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		defer out.Close()
		io.Copy(out, file)

		update["cover_image"] = "/uploads/" + filename
	}

	collection := config.DB.Database("bookwarm").Collection("clubs")
	result, err := collection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, bson.M{"$set": update})
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club updated successfully", "id": clubID})
}

// DeleteClub ลบ Club
func DeleteClub(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("clubs")

	result, err := collection.DeleteOne(context.TODO(), bson.M{"_id": clubID})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club deleted successfully"})
}

// GetClubsByUser ดึง Club ที่ผู้ใช้เป็นสมาชิกหรือเป็นเจ้าของ
func GetClubsByUser(c *gin.Context) {
	log.Println("Attempting to fetch clubs for user...") // Log start
	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	log.Printf("UserID from context: %v, exists: %v\n", userIDRaw, exists) // Log context value

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		log.Println("User ID not found in context. Aborting.") // Log absence
		return
	}

	userIDStr := userIDRaw.(string)
	log.Printf("Attempting to convert UserID string to ObjectID: %s\n", userIDStr) // Log string value
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		log.Printf("Error converting UserID to ObjectID: %v\n", err) // Log conversion error
		return
	}

	log.Printf("Successfully converted UserID to ObjectID: %s\n", userID.Hex()) // Log success
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")

	// หา clubs ที่ user เป็นเจ้าของหรือเป็นสมาชิก
	filter := bson.M{
		"$or": []bson.M{
			{"owner_id": userID},
			{"members": userID},
		},
	}
	log.Printf("Fetching clubs with filter: %+v\n", filter) // Log filter

	cursor, err := clubCollection.Find(context.TODO(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user's clubs from DB"})
		log.Printf("Database query error: %v\n", err) // Log DB error
		return
	}
	defer cursor.Close(context.TODO())

	var clubs []models.Club
	if err := cursor.All(context.TODO(), &clubs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user's clubs from DB"})
		log.Printf("Database decoding error: %v\n", err) // Log decode error
		return
	}

	log.Printf("Successfully fetched %d clubs\n", len(clubs)) // Log success count
	c.JSON(http.StatusOK, clubs)
}

// GetRecommendedClubs returns clubs sorted by member count
func GetRecommendedClubs(c *gin.Context) {
	log.Println("Getting recommended clubs...")
	
	// Get top 6 clubs with most members
	pipeline := mongo.Pipeline{
		{{Key: "$addFields", Value: bson.D{
			{Key: "member_count", Value: bson.D{
				{Key: "$size", Value: bson.D{
					{Key: "$ifNull", Value: []interface{}{"$members", []interface{}{}}},
				}},
			}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "member_count", Value: -1}}}},
		{{Key: "$limit", Value: 6}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "users"},
			{Key: "localField", Value: "owner_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "owner"},
		}}},
		{{Key: "$unwind", Value: bson.D{
			{Key: "path", Value: "$owner"},
			{Key: "preserveNullAndEmptyArrays", Value: true},
		}}},
		{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: 1},
			{Key: "name", Value: 1},
			{Key: "description", Value: 1},
			{Key: "cover_image", Value: 1},
			{Key: "owner_id", Value: 1},
			{Key: "owner_display_name", Value: "$owner.display_name"},
			{Key: "members", Value: 1},
			{Key: "member_count", Value: 1},
			{Key: "created_at", Value: 1},
			{Key: "updated_at", Value: 1},
		}}},
	}

	log.Println("Executing aggregation pipeline...")
	collection := config.DB.Database("bookwarm").Collection("clubs")
	if collection == nil {
		log.Println("Error: Collection is nil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database collection not found"})
		return
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		log.Printf("Error in aggregation: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommended clubs"})
		return
	}
	defer cursor.Close(context.Background())

	var clubs []bson.M
	if err = cursor.All(context.Background(), &clubs); err != nil {
		log.Printf("Error decoding clubs: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode clubs"})
		return
	}

	log.Printf("Found %d recommended clubs\n", len(clubs))

	// Convert ObjectIDs to strings
	for i := range clubs {
		if id, ok := clubs[i]["_id"].(primitive.ObjectID); ok {
			clubs[i]["_id"] = id.Hex()
		}
		if ownerID, ok := clubs[i]["owner_id"].(primitive.ObjectID); ok {
			clubs[i]["owner_id"] = ownerID.Hex()
		}
		if members, ok := clubs[i]["members"].(primitive.A); ok {
			memberIDs := make([]string, len(members))
			for j, member := range members {
				if memberID, ok := member.(primitive.ObjectID); ok {
					memberIDs[j] = memberID.Hex()
				}
			}
			clubs[i]["members"] = memberIDs
		}
	}

	log.Println("Successfully processed clubs data")
	c.JSON(http.StatusOK, gin.H{"clubs": clubs})
}

// CheckMembership checks if the current user is a member of the club
func CheckMembership(c *gin.Context) {
	clubIDHex := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	userIDStr := c.MustGet("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	isMember := isClubMember(userID, clubID)
	c.JSON(http.StatusOK, gin.H{"isMember": isMember})
}
