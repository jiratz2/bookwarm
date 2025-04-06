package config

import (
	"context"
	"fmt"
	"log"
	"time"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Client

func ConnectDB() {
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb+srv://jiratchayaya303:Ff7544948!@cluster0.ljajn.mongodb.net/"))
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	DB = client
	fmt.Println("Connected to MongoDB!")
}