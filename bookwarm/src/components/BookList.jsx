import React, { useEffect, useState } from "react";
import Book from "./Book";
import toast from "react-hot-toast";

const BookList = ({ filters }) => {
  const [books, setBooks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch books from backend
  const fetchBooks = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/books/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Include cookies if needed
      });

      if (res.ok) {
        const data = await res.json();
        setBooks(data);
        toast.success("Books loaded successfully!", {
          duration: 3000,
          position: "top-right",
        });
      } else {
        setErrorMessage("Failed to fetch books.");
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  // Fetch books when component loads
  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter books based on filters
  const filteredBooks = books.filter((book) => {
    const matchesTags =
      filters.tags.length === 0 || filters.tags.some((tag) => book.tagIds.includes(tag));
    const matchesCategories =
      filters.categories.length === 0 || filters.categories.includes(book.category_id);
    return matchesTags && matchesCategories;
  });

  return (
    <div className="book-list">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      {filteredBooks.map((book, index) => (
        <Book
          key={index}
          title={book.title}
          authorId={book.authorId}
          rating={book.rating}
        />
      ))}
    </div>
  );
};

export default BookList;