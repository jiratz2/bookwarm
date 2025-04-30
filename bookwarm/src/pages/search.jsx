import React, { useState } from "react";

const SearchPage = () => {
  const [searchType, setSearchType] = useState("Books"); // Default to "Books"
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
  };

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const renderResults = () => {
    if (searchType === "Books") {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <img
              src="book1.jpg"
              alt="A Good Girl's Guide To Murder"
              className="w-24 h-36 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">A Good Girl's Guide To Murder</h3>
              <p className="text-gray-600">Holly Jackson</p>
              <p className="text-sm text-gray-500">Rating: ★★★★☆</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-200 text-sm rounded">Mystery</span>
                <span className="px-2 py-1 bg-gray-200 text-sm rounded">Thriller</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Want to Read
            </button>
          </div>
          <div className="flex items-center gap-4 border-b pb-4">
            <img
              src="book2.jpg"
              alt="Fourth Wing"
              className="w-24 h-36 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Fourth Wing</h3>
              <p className="text-gray-600">Rebecca Yarros</p>
              <p className="text-sm text-gray-500">Rating: ★★★★★</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-200 text-sm rounded">Fantasy</span>
                <span className="px-2 py-1 bg-gray-200 text-sm rounded">Adventure</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Want to Read
            </button>
          </div>
        </div>
      );
    } else if (searchType === "Clubs") {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <img
              src="club1.jpg"
              alt="Book Happens"
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <h3 className="text-lg font-semibold">Book Happens</h3>
              <p className="text-gray-600">2.5k members</p>
              <p className="text-sm text-gray-500">Created at: May 29, 2017</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-b pb-4">
            <img
              src="club2.jpg"
              alt="The Book Was Better"
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <h3 className="text-lg font-semibold">The Book Was Better</h3>
              <p className="text-gray-600">2.5k members</p>
              <p className="text-sm text-gray-500">Created at: July 14, 2015</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6 mt-20"> {/* เพิ่ม mt-20 เพื่อเลื่อนลงมา 80px */}
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
          className="flex-1 px-4 py-2 border rounded"
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Search
        </button>
      </div>
      <div>{renderResults()}</div>
    </div>
  );
};

export default SearchPage;