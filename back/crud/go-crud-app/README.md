# Go CRUD Application

This project is a simple CRUD (Create, Read, Update, Delete) application built in Go. It connects to a MongoDB database and implements basic operations for managing a resource, such as books. The application does not use any external frameworks, relying solely on the standard library for HTTP handling.

## Project Structure

```
go-crud-app
├── main.go        # Entry point of the application
└── README.md      # Documentation for the project
```

## Getting Started

### Prerequisites

- Go installed on your machine (version 1.16 or later)
- MongoDB instance (either local or cloud-based)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd go-crud-app
   ```

2. Install the necessary dependencies:

   ```
   go get go.mongodb.org/mongo-driver/mongo
   ```

### Configuration

In the `main.go` file, update the MongoDB connection string to point to your MongoDB instance:

```go
client, err := mongo.NewClient(options.Client().ApplyURI("your-mongodb-connection-string"))
```

### Running the Application

To run the application, execute the following command in your terminal:

```
go run main.go
```

The server will start on `localhost:8080`.

### API Endpoints

- **Create a Book**: `POST /books`
- **Get All Books**: `GET /books`
- **Get a Book by ID**: `GET /books/{id}`
- **Update a Book**: `PUT /books/{id}`
- **Delete a Book**: `DELETE /books/{id}`

### Example Requests

- **Create a Book**:

  ```
  POST /books
  Content-Type: application/json

  {
      "title": "Book Title",
      "author": "Author Name",
      "description": "Book Description"
  }
  ```

- **Get All Books**:

  ```
  GET /books
  ```

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.