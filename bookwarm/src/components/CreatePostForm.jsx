import React, { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";

const CreatePostForm = ({ clubId, onPostCreated }) => {
  const [content, setContent] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeoutRef = useRef(null);

  // ฟังก์ชันค้นหาหนังสือพร้อม debounce และรองรับภาษาไทย
  const handleBookSearch = useCallback(async (query) => {
    setBookQuery(query);
    
    if (!query.trim()) {
      setBookResults([]);
      setIsSearching(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // URL encode สำหรับภาษาไทย
        const encodedQuery = encodeURIComponent(query.trim());
        console.log("🔍 Searching for:", query, "| Encoded:", encodedQuery);

        const res = await fetch(
          `http://localhost:8080/api/books/search?query=${encodedQuery}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // ตรวจสอบว่า response เป็น JSON หรือไม่
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error("❌ Non-JSON response received");
          setBookResults([]);
          toast.error("Invalid response format from server");
          return;
        }

        const data = await res.json();
        console.log("📚 Search results:", data);

        if (res.ok) {
          // ตรวจสอบให้แน่ใจว่า data ไม่เป็น null/undefined
          if (data) {
            if (Array.isArray(data)) {
              setBookResults(data);
            } else if (data.books && Array.isArray(data.books)) {
              setBookResults(data.books);
            } else {
              setBookResults([]);
            }
          } else {
            setBookResults([]);
          }
        } else {
          console.error("❌ Book search failed:", data);
          setBookResults([]);
          if (data && data.error) {
            toast.error(`Search failed: ${data.error}`);
          }
        }
      } catch (err) {
        console.error("❌ Network error during book search:", err);
        setBookResults([]);
        
        // ตรวจสอบประเภทของ error
        if (err.name === 'SyntaxError') {
          toast.error("Invalid response from server");
        } else if (err.message.includes('Failed to fetch')) {
          toast.error("Cannot connect to server");
        } else {
          toast.error("Network error during book search");
        }
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms
  }, []);

  const selectBook = (book) => {
    console.log("📖 Selected book:", book);
    setSelectedBookId(book._id || book.id);
    setSelectedBookTitle(book.title);
    setBookQuery("");
    setBookResults([]);
    setIsSearching(false);
  };

  const clearSelectedBook = () => {
    setSelectedBookId(null);
    setSelectedBookTitle("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to post.");
      return;
    }

    if (!content.trim()) {
      toast.error("Post content is required.");
      return;
    }
    
    if (!clubId) {
      toast.error("Club ID not found.");
      return;
    }

    setIsSubmitting(true);

    // สร้าง payload
    const payload = {
      content: content.trim(),
      club_id: clubId,
    };

    // เพิ่ม book_id ถ้ามีการเลือกหนังสือ
    if (selectedBookId) {
      payload.book_id = selectedBookId;
    }

    console.log("📝 Submitting post payload:", payload);

    try {
      const res = await fetch(`http://localhost:8080/api/post/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log("📮 Post response:", responseData);

      if (res.ok) {
        // Reset form
        setContent("");
        setSelectedBookId(null);
        setSelectedBookTitle("");
        setBookQuery("");
        setBookResults([]);
        
        // Refresh post list
        if (onPostCreated) {
          onPostCreated();
        }
        
        toast.success("Post created successfully! 🎉");
      } else {
        console.error("❌ Post creation failed:", responseData);
        toast.error(responseData.error || "Failed to create post.");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Create New Post</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Content textarea */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
            placeholder="What's on your mind? Share your thoughts about books..."
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length}/500 characters
          </div>
        </div>

        {/* Book search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search for a book to reference in your post..."
              value={bookQuery}
              onChange={(e) => handleBookSearch(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Search results */}
          {bookResults.length > 0 && (
            <div className="mt-2">
              <ul className="bg-white border border-gray-300 rounded-lg max-h-48 overflow-auto shadow-lg">
                {bookResults.map((book) => (
                  <li
                    key={book._id || book.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => selectBook(book)}
                  >
                    <div className="font-medium text-gray-900">{book.title}</div>
                    {book.author && (
                      <div className="text-sm text-gray-600">by {book.author}</div>
                    )}
                    {book.year && (
                      <div className="text-xs text-gray-500">Published: {book.year}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No results message */}
          {bookQuery.trim() && !isSearching && bookResults.length === 0 && (
            <div className="mt-2 p-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
              No books found for "{bookQuery}". Try different keywords.
            </div>
          )}
        </div>

        {/* Selected book display */}
        {selectedBookTitle && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-blue-700 font-medium">Selected book:</span>
                <div className="text-blue-900 font-semibold">{selectedBookTitle}</div>
              </div>
              <button
                type="button"
                onClick={clearSelectedBook}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                disabled={isSubmitting}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              isSubmitting || !content.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Posting...
              </div>
            ) : (
              "Create Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;