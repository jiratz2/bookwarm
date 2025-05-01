import React from "react";

const Book = ({ title, authorId, genres,  rating }) => {
  return (
    <div className="book">
      <div className="book-details">
        <h3>{title}</h3>
        <p><strong>Author ID:</strong> {authorId}</p>
        <p><strong>Genres:</strong> {genres}</p>
        <p><strong>Rating:</strong> {rating}</p>
      </div>
    </div>
  );
};

export default Book;