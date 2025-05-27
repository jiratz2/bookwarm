import React, { useState } from "react";
import Filter from "@/components/Filter";
import BookList from "@/components/BookList";

const Explore = () => {
  const [filters, setFilters] = useState({
    tags: [],
    categories: [],
    genres: [],
  });
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="explore mt-[100px]">
      <main className="explore-layout">
        <aside className="explore-sidebar">
          <Filter setFilters={setFilters} />
        </aside>
        <section className="">
          <div className="">
            <h2 className="font-bold text-2xl p-2">Recommend</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-3 pl-5 border border-gray-300 rounded-2xl w-full"
              />
            </div>
          </div>

          <BookList filters={filters} searchTerm={searchTerm} />
        </section>
      </main>
    </div>
  );
};

export default Explore;
