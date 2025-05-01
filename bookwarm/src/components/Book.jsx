import React from "react";

const Book = ({ title, description, authorId, genres, publishYear, pageCount, rating }) => {
  return (
    <div className="book">
      <div className="book-details">
        <h3>{title}</h3>
        <p><strong>Description:</strong> {description}</p>
        <p><strong>Author ID:</strong> {authorId}</p>
        <p><strong>Genres:</strong> {genres.join(", ")}</p>
        <p><strong>Publish Year:</strong> {publishYear}</p>
        <p><strong>Page Count:</strong> {pageCount}</p>
        <p><strong>Rating:</strong> {rating}</p>
      </div>
    </div>
  );
};

export default Book;