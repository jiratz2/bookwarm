package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var collection *mongo.Collection

type Book struct {
	ID          primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	AuthorName  string             `json:"authorName"`
	CreatedAt   time.Time          `json:"createdAt,omitempty" bson:"createdAt,omitempty"`
	UpdatedAt   time.Time          `json:"updatedAt,omitempty" bson:"updatedAt,omitempty"`
}

func connectDB() {
	var err error
	client, err = mongo.NewClient(options.Client().ApplyURI("mongodb+srv://jiratchayaya303:Ff7544948!@cluster0.ljajn.mongodb.net/"))
	if err != nil {
		log.Fatal(err)
	}
	err = client.Connect(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	collection = client.Database("crud").Collection("books")
	fmt.Println("Connected to MongoDB!")
}

func createBook(w http.ResponseWriter, r *http.Request) {
	var book Book
	if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	book.ID = primitive.NewObjectID()
	book.CreatedAt = time.Now()
	book.UpdatedAt = time.Now()

	_, err := collection.InsertOne(context.TODO(), book)
	if err != nil {
		http.Error(w, "Failed to create book", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(book)
}

func getAllBooks(w http.ResponseWriter, r *http.Request) {
	cursor, err := collection.Find(context.TODO(), bson.D{})
	if err != nil {
		http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var books []Book
	for cursor.Next(context.TODO()) {
		var book Book
		if err := cursor.Decode(&book); err != nil {
			http.Error(w, "Failed to decode book", http.StatusInternalServerError)
			return
		}
		books = append(books, book)
	}
	json.NewEncoder(w).Encode(books)
}

func getBookByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.URL.Query().Get("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	var book Book
	err = collection.FindOne(context.TODO(), bson.M{"_id": bookID}).Decode(&book)
	if err != nil {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(book)
}

func updateBook(w http.ResponseWriter, r *http.Request) {
	idParam := r.URL.Query().Get("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	var input Book
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	input.UpdatedAt = time.Now()
	update := bson.M{"$set": input}

	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": bookID}, update)
	if err != nil {
		http.Error(w, "Failed to update book", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(input)
}

func deleteBook(w http.ResponseWriter, r *http.Request) {
	idParam := r.URL.Query().Get("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		http.Error(w, "Failed to delete book", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("Book deleted successfully")
}

func main() {
	connectDB()
	http.HandleFunc("/books", createBook)
	http.HandleFunc("/books/all", getAllBooks)
	http.HandleFunc("/books/get", getBookByID) //http://localhost:8080/books/get?id=<bookid>
	http.HandleFunc("/books/update", updateBook)
	http.HandleFunc("/books/delete", deleteBook)

	fmt.Println("Server is running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
