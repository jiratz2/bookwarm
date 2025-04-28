import React, { useEffect, useState } from "react";

const Book = ({ title, author, description, tags, image }) => {
  return (
    <div className="book">
      <img
        src={image || "https://via.placeholder.com/150"}
        alt={title}
        className="book-image"
      />
      <div className="book-details">
        <h3>{title}</h3>
        <p>{author}</p>
        {description && <p>{description}</p>}
        <div className="tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <button className="action-button">Want to Read</button>
    </div>
  );
};

const BookList = ({ filters }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/books/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBooks(data);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesTags =
      filters.tags.length === 0 ||
      filters.tags.some((tag) => book.tags.some((t) => t._id === tag));
    const matchesCategories =
      filters.categories.length === 0 ||
      filters.categories.includes(book.category[0]._id);
    return matchesTags && matchesCategories;
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="book-list">
      {filteredBooks.length === 0 ? (
        <p>No books found.</p>
      ) : (
        filteredBooks.map((book) => (
          <Book
            key={book._id}
            title={book.title}
            author={book.author[0]?.name || "Unknown Author"}
            tags={book.tags || []}
            image={book.coverImage || "https://via.placeholder.com/150"} // <--- ถูกแล้ว แต่ขึ้นอยู่กับหลังบ้านส่งอะไรมา
          />
        ))
      )}
    </div>
  );
};

export default BookList;
