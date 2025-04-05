package controllers

import (
	"back/config"
	"back/models"
	"back/utils"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"displayname"`
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

		DisplayName: input.DisplayName,
		Email:       input.Email,
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

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
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

	collection := config.DB.Database("bookwarm").Collection("users")
	err := collection.FindOne(context.TODO(), bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Email"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Password"})
		return
	}

	token, _ := utils.CreateToken(user.Email)
	c.JSON(http.StatusOK, gin.H{
		"token":        token,
		"displayname":  user.DisplayName,
		"profile_img_url":  user.ProfilePic,
	})
}

func Profile(c *gin.Context) {
	emailRaw, _ := c.Get("user")
	email := emailRaw.(string)

	var user models.User
	collection := config.DB.Database("courtminton").Collection("user")
	err := collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"displayname":    user.DisplayName,
		"email":           user.Email,
		"profile_img_url": user.ProfilePic,
		"bg_img_url":      user.BgImgURL,
		"bio":             user.Bio,
		"created_at":      user.CreatedAt,
	})
}
