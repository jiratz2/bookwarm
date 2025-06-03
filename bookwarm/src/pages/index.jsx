import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import NavBar from "../components/Navbar";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RecommendSection from "../components/RecommendSection";
import RecommendBooks from "../components/RecommendBooks";
import { Users } from "lucide-react";

export default function Home() {
  const [randomPosts, setRandomPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRandomPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/post/random", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Random posts data:", data);
        setRandomPosts(data.posts || []);
      } else {
        toast.error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  return (
    <div>
      <main className=" mt-30 px-4 md:px-8 lg:px-16 ">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">

            <div>
              <h1 className="text-3xl font-bold mb-8">Recent Club Posts</h1>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : randomPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-5">
                  {randomPosts.map((post) => (
                    <Link
                      key={post._id}
                      href={`/club/${post.club_id}`}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          {post.user_profile_image ? (
                            <img
                              src={post.user_profile_image}
                              alt={post.user_display_name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                          )}
                          <div>
                            <div className="flex items-center">
                              <p className="font-semibold">{post.user_display_name}</p>
                              <Users className="w-4 h-4 mx-2" />
                              <Link
                                href={`/club/${post.club_id}`}
                                className="text-gray-600 hover:underline font-semibold text-sm"
                              >
                                {post.club_name}
                              </Link>
                            </div>

                            <p className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 line-clamp-3">{post.content}</p>

                        {post.book_title && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium text-gray-900">{post.book_title}</p>
                            {post.book_author && (
                              <p className="text-sm text-gray-500">by {post.book_author}</p>
                            )}
                          </div>
                        )}
                        <div className="mt-4 flex items-center text-gray-500 text-sm">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.likes_count || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No posts available at the moment.</p>
                  <Link href="/explore" className="text-blue-500 hover:underline mt-2 inline-block">
                    Explore clubs
                  </Link>
                </div>
              )}
            </div>


            <div className="">
              {/* Add RecommendBooks */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Recommended Books</h2>
                <RecommendBooks />
              </div>

              {/* Add RecommendSection */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Recommended Clubs</h2>
                <RecommendSection />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
