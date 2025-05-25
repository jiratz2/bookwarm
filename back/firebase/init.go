package firebase

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

var FirebaseApp *firebase.App

func InitFirebase() {
	credFile := "config/firebase-admin.json"

	// ตรวจสอบว่าไฟล์ credentials มีอยู่จริง
	if _, err := os.Stat(credFile); os.IsNotExist(err) {
		log.Fatalf("❌ Firebase credentials file not found at: %s", credFile)
	}

	opt := option.WithCredentialsFile(credFile)

	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Firebase: %v", err)
	}

	FirebaseApp = app
	fmt.Println("✅ Firebase Initialized Successfully")
}
