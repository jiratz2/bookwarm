import React, { useState } from "react";
import Filter from "@/components/Filter";
import BookList from "@/components/BookList";
import Toast from "@/components/Toast";

const Explore = () => {
  const [filters, setFilters] = useState({
    tags: [],
    categories: [],
    genres: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="explore mt-[100px]">
      <main className="relative">
        {/* Filter Toggle Button - Only visible on mobile */}
        <button
          onClick={toggleFilter}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
        >
          <span className="material-icons">
            {isFilterOpen ? "close" : "filter_list"}
          </span>
          <span className="text-sm font-medium">
            {isFilterOpen ? "Close" : "Filters"}
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4">
          {/* Filter Sidebar */}
          <aside 
  className={`fixed lg:sticky top-[100px] lg:top-[100px] z-40 bg-white lg:bg-transparent transform transition-transform duration-300 ease-in-out ${
    isFilterOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
  } lg:transform-none h-full lg:h-fit`}
>
  <div className="h-full lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-none p-6 lg:p-0">
    <div className="p-6 rounded-xl shadow-md text-base transition-all scrollbar-none duration-300 ease-in-out hover:shadow-lg hover:translate-y-[-2px] bg-white">
      <Filter setFilters={setFilters} onClose={toggleFilter} />
    </div>
  </div>
</aside>


          {/* Main Content */}
          <section className="w-full">
            <div className="sticky top-[100px] bg-white z-30 pb-4">
              <div className="flex justify-between items-center mb-4 p-2">
                <h2 className="font-bold text-2xl">Recommend</h2>
                <button
                  onClick={toggleFilter}
                  className="lg:hidden flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md"
                >
                  <span className="material-icons text-xl">
                    {isFilterOpen ? "close" : "filter_list"}
                  </span>
                  <span className="text-sm font-medium">
                    {isFilterOpen ? "Close" : "Filters"}
                  </span>
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-3 pl-5 border border-gray-300 rounded-2xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <BookList filters={filters} searchTerm={searchTerm} />
          </section>
        </div>

        {/* Overlay for mobile when filter is open */}
        {isFilterOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={toggleFilter}
          />
        )}
      </main>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default Explore;