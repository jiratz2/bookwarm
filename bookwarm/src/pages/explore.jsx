import React, { useState } from 'react';
import Filter from '@/components/Filter';
import BookList from '@/components/BookList';

const Explore = () => {
  const [filters, setFilters] = useState({ tags: [], categories: [] });

  return (
    <div className="explore mt-[100px]">
      <main className="explore-layout">
        <aside className="explore-sidebar">
          <Filter setFilters={setFilters} />
        </aside>
        <section className="explore-content">
          <h2>Recommend</h2>
          <BookList filters={filters} />
        </section>
      </main>
    </div>
  );
};

export default Explore;