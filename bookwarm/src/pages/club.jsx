"use client";

import { useEffect, useState } from "react";
import CreateClub from "../components/CreateClub";
import ClubCard from "@/components/ClubCard";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Club() {
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/club/");
        const data = await res.json();
        setClubs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter((club) =>
    club.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mt-[100px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Book Clubs</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-5 border border-gray-300 rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredClubs.length === 0 ? (
          <div>No clubs found</div>
        ) : (
          filteredClubs.map((club, index) => (
            <ClubCard
              key={club.id || club._id || index}
              club={club}
              clubId={club.id}
            />
          ))
        )}
      </div>

      {isLoggedIn && (
        <Link href="/createclub">
          <button className="fixed bottom-0 right-0 m-10 bg-blue-800 cursor-pointer hover:bg-blue-900 p-4 px-5 rounded-3xl flex items-center text-white font-bold">
            <Plus className="mr-4" size={30} />
            Create Your Club
          </button>
        </Link>
      )}
    </div>
  );
}
