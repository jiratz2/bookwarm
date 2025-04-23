package models

import(
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Series struct {
	ID 			primitive.ObjectID 	`json:"id" bson:"_id,omitempty"`
	Name 		string 				`json:"name" bson:"name"`
	CreatedAt 	time.Time 			`json:"createdAt" bson:"createdAt"`
	UpdatedAt 	time.Time 			`json:"updatedAt" bson:"updatedAt"`
}