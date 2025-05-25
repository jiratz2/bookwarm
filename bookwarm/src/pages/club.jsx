"use client";

import { useEffect, useState } from "react";
import CreateClub from "../components/CreateClub";
import ClubCard from "@/components/Club";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Club() {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/club/");
        const data = await res.json();
        setClubs(data);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };
    fetchClubs();
  }, []);

  return (
    <div className="max-w-7xl mt-[100px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Book Clubs</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {clubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>
      <Link href="/createclub">
        <button className="fixed bottom-0 right-0 m-10 bg-blue-800 cursor-pointer hover:bg-blue-900 p-4 px-5 rounded-3xl flex items-center text-white font-bold">
          <Plus className="mr-4" size={30} />
          Create Your Club
        </button>
      </Link>
    </div>
  );
}
