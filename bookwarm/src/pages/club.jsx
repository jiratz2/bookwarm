"use client";

import { useEffect, useState } from "react";
import CreateClub from "../components/CreateClub";
import ClubCard from "@/components/ClubCard";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Club() {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        console.log("Fetching clubs..."); // Debug 1
        const res = await fetch("http://localhost:8080/api/club/");
        console.log("Response status:", res.status); // Debug 2
        
        const data = await res.json();
        console.log("Raw data from API:", data); // Debug 3
        console.log("Number of clubs:", data.length); // Debug 4
        
        setClubs(data);
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };
    fetchClubs();
  }, []);

   console.log("Current clubs state:", clubs); // Debug 5

  return (
    <div className="max-w-7xl mt-[100px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Book Clubs</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {clubs.length === 0 ? (
          <div>No clubs found</div>
        ) : (
          clubs.map((club, index) => {
            console.log(`Rendering club ${index}:`, club); // Debug 6
            return <ClubCard key={club.id || club._id || index} 
            club={club} 
            clubId={club.id} />;
          })
        )}
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
