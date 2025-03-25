import React, { useState, } from "react";
import Link from "next/link";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { SearchBar } from "./SearchBar";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedin, setIsLoggedin] = useState(false);

  return (
    <header className="fixed top-0 left-0 flex justify-between items-center px-20 w-full bg-white h-[100px] max-md:px-10 max-sm:px-5 max-sm:h-[80px]">
      <h1 className="text-3xl font-bold text-black max-sm:text-2xl">BookWarm</h1>
      <nav className="text-xl md:text-base flex gap-11 items-center max-sm:hidden">
        <SearchBar />
        <a href="/" className="font-bold text-black hover:text-blue-800">
          Home
        </a>
        <a href="#" className="font-bold text-black hover:text-blue-800">
          Discover
        </a>
        <a href="#" className="font-bold text-black hover:text-blue-800">
          Club
        </a>

        {isLoggedin ? (
          <a href="#" className="font-bold text-black hover:text-blue-800">
            Profile
          </a>
        ) : (
          <Link href="/login" className="font-bold text-black hover:text-blue-800">
            Sign in
          </Link>
        )}
      </nav>

      <button
        className="hidden max-sm:block cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
     <IconMenu2 size={24} />
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        {/* ไอคอนปิด */}
        {isMenuOpen && (
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-6 right-5 z-60 cursor-pointer"
            aria-label="Close Menu"
          >
            <IconX size={24} />
          </button>
        )}

        {/* รายการเมนู */}
        <nav className="flex flex-col items-start px-15 gap-6 mt-20 text-lg font-bold">
          <a href="#" className="text-black">
            Discover
          </a>
          <a href="#" className="text-black">
            Club
          </a>
          {isLoggedin ? (
            <div>
                <a href="#" className="font-bold text-black">
                    Profile
                </a>
                <a href="#" className="text-red-500">
                    Sign Out
                </a>
            </div>
          
        ) : (
          <Link href="/login" className="font-bold text-black">
            Sign in
          </Link>
        )}
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
