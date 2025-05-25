import React, { useState, useEffect } from "react";

export default function SearchPage() {
  const [type, setType] = useState("Clubs");
  const [dropdown, setDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [clubs, setClubs] = useState([]); // เพิ่ม state clubs
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูล club จาก backend
  useEffect(() => {
    if (type === "Clubs") {
      setLoading(true);
      fetch("http://localhost:8080/api/clubs/")
        .then((res) => res.json())
        .then((data) => {
          setClubs(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [type]);

  // ดึงข้อมูลหนังสือจาก API เมื่อเลือก Books
  useEffect(() => {
    if (type === "Books") {
      setLoading(true);
      fetch("http://localhost:8080/api/books/")
        .then((res) => res.json())
        .then((data) => {
          setBooks(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [type]);

  // เลือก data ตาม type
  const data =
    type === "Clubs"
      ? clubs.map((club) => ({
          id: club.id || club._id,
          name: club.name,
          members: club.members || "?", // ถ้ามี field members ใน backend ให้ใช้เลย
          createdAt: club.created_at
            ? new Date(club.created_at).toLocaleDateString()
            : "",
          image: club.cover_image || "https://via.placeholder.com/150",
        }))
      : books.map((book) => ({
          id: book._id,
          name: book.title,
          author: book.author?.[0]?.name || "Unknown Author",
          image: book.coverImage || "https://via.placeholder.com/150",
          tags: book.tags || [],
          rating: book.rating || 0,
        }));

  // filter ตาม query
  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="font-serif px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="font-bold text-2xl">BookWarm</div>
        <div className="flex gap-8 font-bold">
          <span className="cursor-pointer">Home</span>
          <span className="cursor-pointer">Discover</span>
          <span className="cursor-pointer">Club</span>
          <span className="cursor-pointer">Profile</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <button
            className="px-4 py-2 border border-black rounded-lg font-bold text-lg bg-white min-w-[110px] flex items-center"
            onClick={() => setDropdown((d) => !d)}
          >
            {type}
            <span className="ml-2">▼</span>
          </button>
          {dropdown && (
            <div className="absolute top-12 left-0 bg-gray-200 shadow rounded min-w-[110px] z-10">
              <div
                className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-300"
                onClick={() => {
                  setType("Clubs");
                  setDropdown(false);
                }}
              >
                Clubs
              </div>
              <div
                className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-300"
                onClick={() => {
                  setType("Books");
                  setDropdown(false);
                }}
              >
                Books
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={`Search ${type.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2 pl-4 pr-10 border border-black rounded-full text-lg outline-none"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/ba7b0f5aba069a45b5a731171235a86c2b551204"
            alt="search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-6"
            style={{ pointerEvents: "none" }}
          />
        </div>
      </div>

      {/* Results */}
      <div>
        {type === "Books" && loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <div>No results found.</div>
        ) : (
          filtered.map((item) =>
            type === "Clubs" ? (
              <div
                key={item.id}
                className="flex items-center gap-6 mb-9 border-b border-gray-200 pb-6"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover" // ปรับขนาดรูป
                />
                <div>
                  <div className="font-bold text-2xl">{item.name}</div> {/* ปรับขนาดชื่อ */}
                  <div className="text-gray-700 text-lg">
                    {item.members} members
                  </div>
                  <div className="text-gray-500 text-sm">
                    Create at {item.createdAt}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-6 mb-9 border-b border-gray-200 pb-6"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover" // เพิ่มขนาดรูป
                />
                <div>
                  <div className="font-bold text-2xl">{item.name}</div> {/* เพิ่มขนาดชื่อ */}
                  <div className="text-gray-700 text-lg">by {item.author}</div> {/* เพิ่มขนาดผู้แต่ง */}
                  {/* แสดง rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500 text-xl">
                      {item.rating ? "★".repeat(Math.round(item.rating)) : "★"}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      {item.rating ? item.rating.toFixed(1) : "0.0"}
                    </span>
                  </div>
                  {/* แสดง tag */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(item.tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-base" // เพิ่มขนาด tag
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}