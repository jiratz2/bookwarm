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
      <main className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4">
        <aside className="p-6 rounded-xl shadow-md text-base transition-all duration-300 ease-in-out hover:shadow-lg hover:translate-y-[-2px]">
          <Filter setFilters={setFilters} />
        </aside>
        <section className="">
          <div>
            <h2 className="font-bold text-2xl mb-4 p-2">Recommend</h2> 
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