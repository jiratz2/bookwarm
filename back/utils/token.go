package utils

import (
	"time"

	"github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jwtSecret = []byte("INWZA007")

func CreateToken(id primitive.ObjectID, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    id.Hex(),       // ✅ เพิ่ม user ID
		"email": email,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	})
	return token.SignedString(jwtSecret)
}
