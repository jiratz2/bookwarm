package utils

import (
	"time"
	"github.com/dgrijalva/jwt-go"
)

var jwtSecret = []byte("INWZA007")

func CreateToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 14).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}