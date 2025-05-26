package controllers

import (
	"back/config"
	"back/models"
	"back/utils"
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Email       string `json:"email"`
		DisplayName string `json:"displayname"`
		Password    string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hashing error"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("users")

	user := models.User{
		Email:       input.Email,
		DisplayName: input.DisplayName,
		Password:    string(hash),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	res, err := collection.InsertOne(context.TODO(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert error"})
		return
	}

	// ดึง id ออกมา (ObjectID)
	id := res.InsertedID.(primitive.ObjectID)

	c.JSON(http.StatusOK, gin.H{
		"message": "User registered successfully",
		"user_id": id.Hex(),
	})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var user models.User

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Println("Login request for email:", input.Email)
	fmt.Println("Password from request:", input.Password)
	fmt.Println("Password from DB:", user.Password)

	collection := config.DB.Database("bookwarm").Collection("users")
	err := collection.FindOne(context.TODO(), bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Email"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		fmt.Println("Password mismatch error:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Password"})
		return
	}

	token, err := utils.CreateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":         "User login successfully",
		"token":           token,
		"displayname":     user.DisplayName,
		"profile_img_url": user.ProfilePic,
	})
}

func GetMe(c *gin.Context) {
	userIdRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIdStr, ok := userIdRaw.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid userId type"})
		return
	}

	// แปลง userId จาก string เป็น ObjectID
	userId, err := primitive.ObjectIDFromHex(userIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId"})
		return
	}

	var user models.User
	collection := config.DB.Database("bookwarm").Collection("users")
	err = collection.FindOne(context.TODO(), bson.M{"_id": userId}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID.Hex(),
		"displayname":     user.DisplayName,
		"profile_img_url": user.ProfilePic,
		"email":           user.Email,
	})
}


func Profile(c *gin.Context) {
	emailRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	email := emailRaw.(string)

	var user models.User
	collection := config.DB.Database("bookwarm").Collection("users")
	err := collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"displayname":     user.DisplayName,
		"profile_img_url": user.ProfilePic,
		"bg_img_url":      user.BgImgURL,
		"bio":             user.Bio,
		"email":           user.Email,
		"created_at":      user.CreatedAt,
		"updated_at":      user.UpdatedAt,
	})
}

func UpdateProfile(c *gin.Context) {
	emailRaw, _ := c.Get("user")
	email := emailRaw.(string)

	// รับข้อมูลจาก FormData
	displayName := c.PostForm("displayname")
	bio := c.PostForm("bio")

	// รับไฟล์รูปภาพโปรไฟล์
	var profilePicURL string
	file, err := c.FormFile("profile_picture")
	if err == nil {
		// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
		if err := os.MkdirAll("uploads", 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
			return
		}
		
		filePath := fmt.Sprintf("uploads/%d_%s", time.Now().Unix(), file.Filename)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile picture"})
			return
		}
		// ใช้ URL แบบเต็มที่สามารถเข้าถึงได้จาก frontend
		profilePicURL = fmt.Sprintf("http://localhost:8080/%s", filePath)
	}

	// รับไฟล์ Cover Photo
	var coverPhotoURL string
	coverFile, err := c.FormFile("cover_photo")
	if err == nil {
		// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
		if err := os.MkdirAll("uploads", 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
			return
		}
		
		coverFilePath := fmt.Sprintf("uploads/%d_%s", time.Now().Unix(), coverFile.Filename)
		if err := c.SaveUploadedFile(coverFile, coverFilePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover photo"})
			return
		}
		// ใช้ URL แบบเต็มที่สามารถเข้าถึงได้จาก frontend
		coverPhotoURL = fmt.Sprintf("http://localhost:8080/%s", coverFilePath)
	}

	collection := config.DB.Database("bookwarm").Collection("users")

	// อัปเดตข้อมูลใน MongoDB
	update := bson.M{
		"$set": bson.M{
			"displayname": displayName,
			"bio":         bio,
			"updated_at":  time.Now(),
		},
	}

	if profilePicURL != "" {
		update["$set"].(bson.M)["profile_img_url"] = profilePicURL
	}

	if coverPhotoURL != "" {
		update["$set"].(bson.M)["bg_img_url"] = coverPhotoURL
	}

	_, err = collection.UpdateOne(context.TODO(), bson.M{"email": email}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}