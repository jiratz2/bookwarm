package utils

import (
	"time"

	"github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jwtSecret = []byte("INWZA007")

func CreateToken(id primitive.ObjectID, email string, displayName string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":          id.Hex(),
		"email":       email,
		"displayname": displayName,
		"exp":         time.Now().Add(time.Hour * 72).Unix(),
	})
	return token.SignedString(jwtSecret)
}
