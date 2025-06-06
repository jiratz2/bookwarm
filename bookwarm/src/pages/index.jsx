import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import NavBar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RecommendSection from "../components/RecommendSection";
import RecommendBooks from "../components/RecommendBooks";
import { Users } from "lucide-react";
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const router = useRouter();
  const [randomPosts, setRandomPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replies, setReplies] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [clubMemberships, setClubMemberships] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.id || decoded._id);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  // Check club membership
  const checkClubMembership = async (clubId) => {
    const token = localStorage.getItem("token");
    if (!token || !clubId) return false;

    try {
      const response = await fetch(`http://localhost:8080/api/club/${clubId}/check-membership`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return response.ok && data.isMember;
    } catch (err) {
      console.error("Error checking club membership:", err);
      return false;
    }
  };

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
        
        // Check memberships for each post's club
        const membershipChecks = {};
        for (const post of data.posts || []) {
          if (post.club_id) {
            membershipChecks[post.club_id] = await checkClubMembership(post.club_id);
          }
        }
        setClubMemberships(membershipChecks);
        
        // Fetch replies for each post
        data.posts?.forEach(post => fetchReplies(post._id));
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

  const fetchReplies = async (postId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/reply/post/${postId}/replies`);
      const data = await res.json();
      setReplies(prev => ({ ...prev, [postId]: data.replies }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleLikeToggle = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to like posts");
      setTimeout(() => {
        router.push("/login");
      }, 1500); // Wait for 1.5 seconds before redirecting
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:8080/api/post/${postId}/like`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success(data.message);
        // Update the specific post's like status instead of fetching all posts
        setRandomPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const isLiked = hasUserLikedPost(post);
              return {
                ...post,
                likes: isLiked 
                  ? post.likes.filter(id => id !== JSON.parse(atob(token.split('.')[1])).id)
                  : [...(post.likes || []), JSON.parse(atob(token.split('.')[1])).id],
                likes_count: isLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1
              };
            }
            return post;
          })
        );
      } else {
        toast.error(data.error || "Failed to toggle like");
      }
    } catch (err) {
      console.error("Like toggle error:", err);
      toast.error("Network error. Please check your connection.");
    }
  };

  const handleReply = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to reply");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/reply/post/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyContent[postId] }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setReplyContent(prev => ({ ...prev, [postId]: "" }));
        fetchReplies(postId);
        toast.success("Reply posted successfully");
      } else {
        toast.error(data.error || "Failed to post reply");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleLikeReply = async (replyId, postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to like replies");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/reply/${replyId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        fetchReplies(postId);
      } else {
        toast.error(data.error || "Failed to like reply");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Function to check if the current user has liked the post
  const hasUserLikedPost = (post) => {
    const token = localStorage.getItem("token");
    if (!token || !post.likes) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      return post.likes.includes(userId);
    } catch (e) {
      console.error("Error decoding token:", e);
      return false;
    }
  };

  // Function to check if the current user has liked the reply
  const hasUserLikedReply = (reply) => {
    const token = localStorage.getItem("token");
    if (!token || !reply.likes) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      return reply.likes.includes(userId);
    } catch (e) {
      console.error("Error decoding token for reply like check:", e);
      return false;
    }
  };

  const getProfileLink = (userId) => {
    if (userId === currentUserId) {
      return "/profile";
    }
    return `/profile/${userId}`;
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <main className="mt-30 px-4 md:px-8 lg:px-16">
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
                    <div
                      key={post._id}
                      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <Link href={getProfileLink(post.user_id)}>
                            {post.user_profile_image ? (
                              <img
                                src={post.user_profile_image}
                                alt={post.user_display_name}
                                className="w-10 h-10 rounded-full mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 cursor-pointer hover:opacity-80 transition-opacity"></div>
                            )}
                          </Link>
                          <div>
                            <div className="flex items-center">
                              <Link href={getProfileLink(post.user_id)} className="font-semibold hover:text-blue-600 transition-colors">
                                {post.user_display_name}
                              </Link>
                              <Users className="w-4 h-4 mx-2" />
                              <Link
                                href={`/club/${post.club_id}`}
                                className="text-gray-600 hover:underline font-semibold text-sm"
                              >
                                {post.club_name}
                              </Link>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <p>{new Date(post.created_at).toLocaleDateString()}</p>
                              {post.book_title && (
                                <>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <span className="text-gray-600">กำลังพูดถึง</span>
                                  <Link
                                    href={`/bookProfile/${post.book_id}`}
                                    className="ml-1 text-blue-600 hover:underline font-medium"
                                  >
                                    {post.book_title}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 line-clamp-3">{post.content}</p>

                        <div className="mt-4 flex items-center text-gray-500 text-sm">
                          <button
                            onClick={() => handleLikeToggle(post._id)}
                            className={`flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-gray-50 ${
                              hasUserLikedPost(post) ? 'text-red-500' : ''
                            }`}
                            title="Like/Unlike post"
                            disabled={!localStorage.getItem("token")}
                          >
                            <span className="text-lg">
                              {hasUserLikedPost(post) ? <FaHeart /> : <FaRegHeart />}
                            </span>
                            <span className="text-sm font-medium">
                              {post.likes_count || post.likes?.length || 0}
                            </span>
                          </button>
                        </div>

                        {/* Only show reply button for club members */}
                        {clubMemberships[post.club_id] && (
                          <button
                            onClick={() => {
                              setShowReplyForm(prev => ({ ...prev, [post._id]: !prev[post._id] }));
                              if (!replies[post._id]) fetchReplies(post._id);
                            }}
                            className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Reply
                          </button>
                        )}

                        {/* Only show reply form for club members */}
                        {clubMemberships[post.club_id] && showReplyForm[post._id] && (
                          <form onSubmit={e => { e.preventDefault(); handleReply(post._id); }} className="mt-4 flex items-center space-x-2">
                            <textarea
                              value={replyContent[post._id] || ""}
                              onChange={e => setReplyContent(prev => ({ ...prev, [post._id]: e.target.value }))}
                              className="flex-grow p-2 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Write a reply..."
                              rows={1}
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                              Send
                            </button>
                          </form>
                        )}

                        {/* Replies section */}
                        {(replies[post._id] || []).map(reply => (
                          <div key={reply._id} className="flex items-start space-x-3 mt-4 bg-gray-50 rounded-lg p-3">
                            {reply.user_profile_image ? (
                              <img
                                src={reply.user_profile_image}
                                alt={reply.user_display_name || reply.user_username || "User"}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-md">
                                {reply.user_display_name
                                  ? reply.user_display_name.charAt(0).toUpperCase()
                                  : reply.user_username?.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 text-base">{reply.user_display_name || reply.user_username || "Unknown User"}</span>
                                {reply.user_username && (
                                  <span className="text-xs text-gray-500">@{reply.user_username}</span>
                                )}
                              </div>
                              <div className="text-gray-800 mt-1">{reply.content}</div>
                            </div>
                            <button
                              className={`ml-2 text-lg p-1 rounded hover:bg-gray-100 transition-colors flex items-center ${
                                hasUserLikedReply(reply) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                              }`}
                              onClick={() => handleLikeReply(reply._id, post._id)}
                              disabled={!localStorage.getItem("token")}
                              title={localStorage.getItem("token") ? "Like/Unlike reply" : "Please log in to like"}
                            >
                              {hasUserLikedReply(reply) ? <FaHeart /> : <FaRegHeart />}
                              <span className="text-sm font-medium ml-1">{reply.likes ? reply.likes.length : 0}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
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
