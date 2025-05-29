import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import CreatePostForm from "./CreatePostForm";

const Post = ({ clubId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState({});
  const [replies, setReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});

  // ดึงโพสต์ทั้งหมดของคลับ
  const fetchPosts = async () => {
    if (!clubId) {
      setError("Club ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/post/?clubId=${clubId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log("📮 Posts data:", data);

      if (response.ok) {
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
        }
      } else {
        console.error("❌ Failed to fetch posts:", data);
        setError(data.error || "Failed to load posts");
        toast.error(data.error || "Failed to load posts");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setError("Network error. Please check your connection.");
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ไลก์/ไม่ไลก์โพสต์
  const handleLikeToggle = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to like posts");
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
        fetchPosts();
      } else {
        toast.error(data.error || "Failed to toggle like");
      }
    } catch (err) {
      console.error("❌ Like toggle error:", err);
      toast.error("Network error");
    }
  };

  // ลบโพสต์
  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to delete posts");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/post/${postId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Post deleted successfully");
        fetchPosts();
      } else {
        toast.error(data.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Network error");
    }
  };

  const fetchReplies = async (postId) => {
    console.log("Fetching replies for post ID:", postId);
    const res = await fetch(`http://localhost:8080/api/reply/post/${postId}/replies`);
    const data = await res.json();
    setReplies(prev => ({ ...prev, [postId]: data.replies }));
  };

  const handleReply = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to reply");
      return;
    }
    try {
      await fetch(`http://localhost:8080/api/reply/post/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyContent[postId] }),
      });
      setReplyContent(prev => ({ ...prev, [postId]: "" }));
      fetchReplies(postId);
    } catch (err) {
      toast.error("Network error");
    }
  };

  // ไลก์/ไม่ไลก์ reply
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

  useEffect(() => {
    fetchPosts();
  }, [clubId]);

  // useEffect สำหรับ fetch replies
  useEffect(() => {
    posts.forEach(post => {
      fetchReplies(post._id);
    });
  }, [posts]);

  // ฟังก์ชันช่วยจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ฟังก์ชันจัดการ URL รูปภาพ
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // ถ้าเป็น URL เต็ม (http:// หรือ https://) ใช้เลย
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // ถ้าเป็น path ภายใน (เริ่มต้นด้วย /) ให้เติม host
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }

    // ถ้าเป็น path ภายในที่ไม่มี / นำหน้า
    return `http://localhost:8080/${imageUrl}`;
  };

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของโพสต์หรือไม่
  const isPostOwner = (post) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("token id:", payload.id, "post.user_id:", post.user_id);
      return payload.id === post.user_id;
    } catch {
      return false;
    }
  };

  // ฟังก์ชันแสดงรูปโปรไฟล์หรือ initial
  const renderUserAvatar = (post) => {
    if (post.user_profile_image) {
      return (
        <img
          src={post.user_profile_image}
          alt={post.user_display_name || post.user_username || "User"}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          onError={(e) => {
            // ถ้าโหลดรูปไม่ได้ให้แสดง initial แทน
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
        {post.user_display_name 
          ? post.user_display_name.charAt(0).toUpperCase()
          : post.user_username?.charAt(0).toUpperCase() || "U"
        }
      </div>
    );
  };

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ reply หรือไม่
  const isReplyOwner = (reply) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("token id:", payload.id, "reply.user_id:", reply.user_id);
      return payload.id === reply.user_id;
    } catch {
      return false;
    }
  };

  // ลบ reply
  const handleDeleteReply = async (replyId, postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to delete replies");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this reply?")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Reply deleted successfully");
        fetchReplies(postId);
      } else {
        toast.error(data.error || "Failed to delete reply");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600">
            Be the first to share something with your book club!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePostForm clubId={clubId} onPostCreated={fetchPosts} />
      {posts.map((post) => (
        <div
          key={post._id}
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          {/* Header ของโพสต์ */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Avatar/Profile Image */}
              <div className="relative">
                {post.user_profile_image ? (
                  <img
                    src={getImageUrl(post.user_profile_image)}
                    alt={post.user_display_name || post.user_username || "User"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {post.user_display_name 
                      ? post.user_display_name.charAt(0).toUpperCase()
                      : post.user_username?.charAt(0).toUpperCase() || "U"
                    }
                  </div>
                )}
                {/* Fallback avatar (hidden by default) */}
                <div 
                  className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md"
                  style={{ display: 'none' }}
                >
                  {post.user_display_name 
                    ? post.user_display_name.charAt(0).toUpperCase()
                    : post.user_username?.charAt(0).toUpperCase() || "U"
                  }
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  {post.user_display_name || post.user_username || "Unknown User"}
                </h4>
                {/* แสดง username ถ้ามี display_name */}
                {post.user_display_name && post.user_username && (
                  <p className="text-sm text-gray-500">@{post.user_username}</p>
                )}
                <p className="text-sm text-gray-500">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            
            {/* ปุ่มลบสำหรับเจ้าของโพสต์ */}
            {isPostOwner(post) && (
              <button
                onClick={() => handleDeletePost(post._id)}
                className="text-red-500 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete post"
              >
                🗑️
              </button>
            )}
          </div>

          {/* เนื้อหาโพสต์ */}
          <div className="mb-4">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* ข้อมูลหนังสือ (ถ้ามี) */}
          {post.book_title && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-blue-600 mr-3 text-lg">📚</span>
                <div>
                  <p className="font-medium text-blue-900">
                    {post.book_title}
                  </p>
                  {post.book_author && (
                    <p className="text-sm text-blue-700">
                      by {post.book_author}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeToggle(post._id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-gray-50"
              >
                <span className="text-lg">❤️</span>
                <span className="text-sm font-medium">
                  {post.likes_count || post.likes?.length || 0}
                </span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              {post.updated_at !== post.created_at && (
                <span>Edited {formatDate(post.updated_at)}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setShowReplyForm(prev => ({ ...prev, [post._id]: !prev[post._id] }));
              if (!replies[post._id]) fetchReplies(post._id);
            }}
          >
            ตอบกลับ
          </button>
          {typeof window !== "undefined" && localStorage.getItem("token") && showReplyForm[post._id] && (
            <form onSubmit={e => { e.preventDefault(); handleReply(post._id); }}>
              <textarea
                value={replyContent[post._id] || ""}
                onChange={e => setReplyContent(prev => ({ ...prev, [post._id]: e.target.value }))}
              />
              <button type="submit">ส่ง</button>
            </form>
          )}
          {!typeof window !== "undefined" && !localStorage.getItem("token") && showReplyForm[post._id] && (
            <div className="text-red-500">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น</div>
          )}

          {/* แสดง replies เฉพาะของโพสต์นี้ */}
          {(replies[post._id] || []).map(reply => {
            console.log("reply object:", reply);
            return (
              <div key={reply._id} className="flex items-start space-x-3 mt-4 bg-gray-50 rounded-lg p-3">
                {/* รูปโปรไฟล์ */}
                {reply.user_profile_image ? (
                  <img
                    src={getImageUrl(reply.user_profile_image)}
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
                {/* ปุ่มไลก์ */}
                <button
                  className={`ml-2 text-lg ${reply.likes && localStorage.getItem("token") && reply.likes.some(id => id === JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id) ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
                  onClick={() => handleLikeReply(reply._id, post._id)}
                  disabled={!localStorage.getItem("token")}
                  title={localStorage.getItem("token") ? "Like/Unlike" : "Please log in to like"}
                >
                  ❤️ <span className="text-base">{reply.likes ? reply.likes.length : 0}</span>
                </button>
                {/* ปุ่มลบ reply เฉพาะเจ้าของ */}
                {isReplyOwner(reply) && (
                  <button
                    className="ml-2 text-red-500 hover:text-red-700 text-lg p-1 rounded hover:bg-red-50 transition-colors"
                    onClick={() => handleDeleteReply(reply._id, post._id)}
                    title="Delete reply"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Post;