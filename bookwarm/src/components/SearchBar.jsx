import React from "react";

export function SearchBar() {
  return (
    <div className="hidden lg:flex flex-1 mx-10">
      <div className="relative mx-auto max-w-full">
        <input
          type="search"
          placeholder="Search..."
          className=" w-full bg-white rounded-3xl border border-black shadow-sm h-[30px] pl-4 pr-12"
          aria-label="Search books"
        />
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ba7b0f5aba069a45b5a731171235a86c2b551204"
          alt="Search"
          className="absolute right-[13px] top-[3px] w-[28px] h-[23px]"
        />
      </div>
    </div>
  );
}
