import Link from "next/link";
import React, { useEffect, useState } from "react";

const Book = ({ title, author,categories,genres, tags, image, bookId }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  };
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border border-gray-200 p-8 rounded-xl bg-white transition-shadow duration-300 hover:shadow-md hover:shadow-gray-300">
      <Link href={`/bookProfile/${bookId}`} className="flex gap-6 no-underline text-inherit flex-1">
        <img
          src={image || "https://placehold.co/150x225/e5e7eb/374151?text=No+Image"}
          alt={title}
          className="w-[120px] h-[180px] sm:w-[150px] sm:h-[225px] object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/150x225/e5e7eb/374151?text=No+Image";
          }}
        />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <p className="text-base text-gray-600">{author}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((category, index) => (
              <span key={index} className="bg-blue-200 text-gray-700 px-3 py-1.5 rounded-xl text-sm">
                {category.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {genres.map((genre, index) => (
              <span key={index} className="bg-red-200 text-gray-700 px-3 py-1.5 rounded-xl text-sm">
                {genre.name}
              </span> 
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
              <span key={index} className="bg-green-200 text-gray-700 px-3 py-1.5 rounded-xl text-sm">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="relative mt-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition flex items-center"
          onClick={toggleDropdown}
        >
          Want to Read
          <span className="ml-2">▼</span>
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-blue-600 text-white border border-blue-700 rounded-md shadow-lg z-10">
            <ul className="py-2">
              <li className="px-4 py-2 font-bold">Mark as</li>
              <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                Want to Read
              </li>
              <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                Now Reading
              </li>
              <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                Read
              </li>
              <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                Did Not Finish
              </li>
              <li className="px-4 py-2 font-bold hover:bg-blue-700 cursor-pointer">Write review</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const BookList = ({ filters, searchTerm }) => {
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
        setBooks(Array.isArray(data) ? data : []);
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
      filters.tags.some((tag) => book.tags?.some((t) => t._id === tag));
    
    const matchesGenres =
      filters.genres.length === 0 ||
      filters.genres.some((genre) => book.genres?.some((g) => g._id === genre));

    const matchesCategories =
      filters.categories.length === 0 ||
      filters.categories.includes(book.category?.[0]?._id);

    const matchesSearch =
      !searchTerm ||
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTags && matchesCategories && matchesSearch && matchesGenres;
  });

  if (loading) {
    return <p className="text-center text-lg text-gray-600 mt-8">Loading books...</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4">
      {filteredBooks.length === 0 ? (
        <p className="col-span-full text-center text-lg text-gray-600 mt-8">No books found matching your criteria.</p>
      ) : (
        filteredBooks.map((book) => (
          <Book
            key={book._id}
            bookId={book._id}
            title={book.title}
            author={book.author?.[0]?.name || "Unknown Author"}
            genres={book.genres || []}
            categories={book.category || []}
            tags={book.tags || []}
            image={book.coverImage}
          />
        ))
      )}
    </div>
  );
};

export default BookList;
