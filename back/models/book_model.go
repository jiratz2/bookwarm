package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Book struct {
	ID          primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	Title       string               `json:"title" bson:"title"`
	Description string               `json:"description" bson:"description"`
	AuthorID    primitive.ObjectID   `json:"authorId" bson:"authorId"`
	SeriesID    *primitive.ObjectID  `json:"seriesId,omitempty" bson:"seriesId,omitempty"`
	CategoryID  primitive.ObjectID   `json:"category_id" bson:"category_id"`
	Genres      []primitive.ObjectID `json:"genres" bson:"genres"`
	TagIDs      []primitive.ObjectID `json:"tagIds" bson:"tagIds"`
	PublishYear int                  `json:"publishYear" bson:"publishYear"`
	PageCount   int                  `json:"pageCount" bson:"pageCount"`
	Rating      float64              `json:"rating" bson:"rating"`
	CoverImage  string               `json:"coverImage" bson:"coverImage"`
	CreatedAt   time.Time            `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time            `json:"updatedAt" bson:"updatedAt"`
}
