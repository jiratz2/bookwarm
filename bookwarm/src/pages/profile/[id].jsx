import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Users } from "lucide-react";
import BookCover from "@/components/BookCover";
import { jwtDecode } from "jwt-decode";

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markedBooks, setMarkedBooks] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (id) {
      setProfileUserId(id);
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const loggedInUserId = decoded.id || decoded._id;
          setCurrentUserId(loggedInUserId);
          setProfileUserId(loggedInUserId);
        } catch (err) {
          console.error("Failed to decode token:", err);
          setIsLoading(false);
        }
      } else {
        console.error("No token found and no user ID in URL.");
        setIsLoading(false);
      }
    }
  }, [id, router.isReady]);

  useEffect(() => {
    if (profileUserId) {
      fetchUserProfile(profileUserId);
      fetchUserBooks(profileUserId);
      fetchUserClubs(profileUserId);
    }
  }, [profileUserId]);

  const fetchUserProfile = async (userIdToFetch) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/user/${userIdToFetch}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      } else if (res.status === 404) {
        setUserData(null);
      } else {
        toast.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBooks = async (userIdToFetch) => {
    if (!userIdToFetch) return;
    try {
      console.log(`Fetching books for user ID: ${userIdToFetch}`);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/marks/user/${userIdToFetch}/marks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Successfully fetched marked books data:", data);
        setMarkedBooks(data);
      } else {
        console.error(`Failed to fetch marked books. Status: ${res.status}`);
        setMarkedBooks([]);
      }
    } catch (error) {
      console.error("Error fetching user's books:", error);
      setMarkedBooks([]);
    }
  };

  const fetchUserClubs = async (userIdToFetch) => {
    if (!userIdToFetch) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/club/user/${userIdToFetch}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Fetched user clubs data:", data);
        setUserClubs(Array.isArray(data) ? data : []);
      } else {
        setUserClubs([]);
      }
    } catch (error) {
      console.error("Error fetching user's clubs:", error);
      setUserClubs([]);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:8080${imageUrl}`;
    }

    return `http://localhost:8080/uploads/${imageUrl}`;
  };

  const renderUserAvatar = (profileImgUrl, displayName) => {
    const getCorrectImageUrl = (imgUrl) => {
      if (!imgUrl) return null;
      if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
        return imgUrl;
      }
      if (imgUrl.startsWith('/')) {
        return `http://localhost:8080${imgUrl}`;
      }
      return `http://localhost:8080/uploads/${imgUrl}`;
    };

    if (profileImgUrl) {
      return (
        <img
          src={getCorrectImageUrl(profileImgUrl)}
          alt={displayName || "User"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            const parentDiv = e.target.closest('.w-40.h-40.rounded-full');
            if (parentDiv) {
              const initialDiv = parentDiv.querySelector('.w-full.h-full.bg-gradient-to-r');
              if (initialDiv) initialDiv.style.display = 'flex';
            }
          }}
        />
      );
    }

    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
    return (
      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-6xl">
        {initial}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-32 w-32 rounded-full bg-gray-200 -mt-16"></div>
            <div className="h-8 w-48 bg-gray-200 mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUserProfile = currentUserId && userData && currentUserId === userData._id;

  console.log("Debug: currentUserId", currentUserId);
  console.log("Debug: userData", userData);
  console.log("Debug: isCurrentUserProfile", isCurrentUserProfile);

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
      <ToastContainer />
      <div className="relative">
        <div className="w-full h-40 md:h-60 lg:h-50 bg-gray-200 relative">
          {userData.bg_img_url ? (
            <img
              src={getImageUrl(userData.bg_img_url)}
              alt="Cover photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
          )}

          <div className="flex justify-evenly">
            <div className="absolute left-1/2 transform -translate-x-1/2 md:left-32 md:translate-x-0 -bottom-20">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden">
                  {renderUserAvatar(userData.profile_img_url, userData.displayname)}
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 px-32 flex justify-between w-full">
              <div className="mt-3 px-50">
                <h1 className="text-3xl font-bold uppercase">{userData.displayname}</h1>
                <p className="text-gray-600 mt-1 text-lg max-w-5xl">{userData.bio}</p>
              </div>
              {isCurrentUserProfile && (
                <div>
                  <div className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 mt-5 rounded-md text-lg hover:cursor-pointer font-bold">
                    <Link href={`/editprofile`}>
                      Edit profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-[140px] mt-30 font-bold text-xl">
        <div className="mb-12">
          <div className="flex justify-between">
            <h2>Book shelf</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 py-2">
            {markedBooks && markedBooks.length > 0 ? (
              markedBooks.map((mark) => (
                mark.book && (
                  <Link key={mark._id} href={`/book/${mark.book._id}`}>
                    <div className="flex flex-col cursor-pointer">
                      <div className="transform hover:scale-105 transition-transform duration-200">
                        <BookCover book={mark.book} />
                      </div>
                    </div>
                  </Link>
                )
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">No books marked yet.</p>
                <p className="text-gray-400 text-sm mt-2">Start exploring books and add them to your bookshelf!</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex justify-between mt-8 mb-3">
            <h2>Clubs</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-5">
            {userClubs.length > 0 ? (
              userClubs.map((club) => {
                console.log("Club ID for key:", club.id);
                return (
                  <Link key={club.id} href={`/club/${club.id}`} className="cursor-pointer">
                    <div className="w-24 h-36 md:w-32 md:h-48 lg:w-65 lg:h-65 rounded-md overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-200">
                      <img
                        src={getImageUrl(club.cover_image) || "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover"}
                        alt={club.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover";
                        }}
                      />
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-gray-500 text-base col-span-full text-center py-8">Not a member of any clubs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 