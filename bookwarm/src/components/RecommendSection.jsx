import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

const RecommendSection = () => {
  const [recommendedClubs, setRecommendedClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedClubs = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching recommended clubs...");
        const res = await fetch("http://localhost:8080/api/club/recommended", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Recommended clubs data:", data);
          setRecommendedClubs(data.clubs || []);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch recommended clubs:", errorData);
          toast.error("Failed to fetch recommended clubs");
        }
      } catch (error) {
        console.error("Error fetching recommended clubs:", error);
        toast.error("Error connecting to server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedClubs();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendedClubs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recommended clubs available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4">
      {recommendedClubs.map((club) => (
        <Link
          key={club._id}
          href={`/club/${club._id}`}
          className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <div className="relative h-32 mb-4">
            {club.cover_image ? (
              <img
                src={club.cover_image.startsWith("http") ? club.cover_image : `http://localhost:8080${club.cover_image}`}
                alt={club.name}
                className="w-full h-[140px] object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-[140px] bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg" />
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{club.name}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{club.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{club.owner_display_name}</span>
              <span>{club.member_count} members</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecommendSection; 