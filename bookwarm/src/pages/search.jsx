import React, { useState, useEffect } from "react";

const mockClubs = [
  { id: 1, name: "Sci-fi Lovers", description: "A club for sci-fi book fans" },
  { id: 2, name: "Manga Readers", description: "All things manga and anime" },
];

const SearchPage = () => {
  const [searchType, setSearchType] = useState("Books");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [clubs, setClubs] = useState(mockClubs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchType === "Books" && books.length === 0) {
      fetchBooks();
    }
  }, [searchType]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/books");
      if (!response.ok) throw new Error("Failed to fetch books");
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
  };

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (searchType === "Books") fetchBooks();
    }
  };

  const renderResults = () => {
    if (loading) return <p>กำลังโหลด...</p>;

    if (searchType === "Books") {
      const filteredBooks = books.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredBooks.length === 0) {
        return <p className="text-gray-500">ไม่พบหนังสือที่ค้นหา</p>;
      }

      return (
        <div className="space-y-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="flex items-center gap-4 border-b pb-4">
              <img
                src={book.imageUrl || "book-placeholder.jpg"}
                alt={book.title}
                className="w-24 h-36 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-gray-600">{book.authorId}</p>
                <p className="text-sm text-gray-500">
                  Rating: {book.rating || "N/A"}
                </p>
                <div className="flex gap-2 mt-2">
                  {book.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 text-sm rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Want to Read
              </button>
            </div>
          ))}
        </div>
      );
    } else if (searchType === "Clubs") {
      const filteredClubs = clubs.filter((club) =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredClubs.length === 0) {
        return <p className="text-gray-500">ไม่พบคลับที่ค้นหา</p>;
      }

      return (
        <div className="space-y-4">
          {filteredClubs.map((club) => (
            <div key={club.id} className="border p-4 rounded shadow-sm">
              <h3 className="text-lg font-bold">{club.name}</h3>
              <p className="text-sm text-gray-600">{club.description}</p>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="p-6 mt-20">
      <div className="flex items-center gap-4 mb-6">
        <select
          value={searchType}
          onChange={handleSearchTypeChange}
          className="px-4 py-2 border rounded"
        >
          <option value="Books">Books</option>
          <option value="Clubs">Clubs</option>
        </select>
        <input
          type="text"
          placeholder={`Search ${searchType.toLowerCase()}...`}
          value={searchQuery}
          onChange={handleSearchQueryChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={searchType === "Books" ? fetchBooks : () => {}}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>
      <div>{renderResults()}</div>
    </div>
  );
};

export default SearchPage;
