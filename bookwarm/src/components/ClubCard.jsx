import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ClubCard({ club, className, clubId }) {
  console.log("Club data:", club);
  console.log("Cover image:", club.cover_image);
  const getImageUrl = (coverImage) => {
    if (!coverImage) return null;
    
    // ถ้าเป็น URL เต็ม (https://) ใช้เลย
    if (coverImage.startsWith('http')) {
      return coverImage;
    }
    
    // ถ้าเป็น path ภายใน (/uploads/...) ต้องเพิ่ม localhost
    if (coverImage.startsWith('/uploads/')) {
      return `http://localhost:8080${coverImage}`;
    }
    
    return null;
  };

  const imageUrl = getImageUrl(club.cover_image);
  console.log("Final image URL:", imageUrl);
  
  return (
    <Link href={`/club/${clubId}`} className="group">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div
          className={
            ("overflow-hidden transition-all hover:shadow-md", className)
          }
        >
          <div className="relative aspect-square overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={club.name}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  console.log("Image failed to load:", e.target.src);
                  e.target.style.display = 'none';
                  // แสดงข้อความแทน
                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-500">Image not found</span></div>';
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", imageUrl);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
          <div className="pt-4 px-2">
            <div className="line-clamp-1 font-bold text-lg">{club.name}</div>
          </div>
          <div className="flex items-center justify-between p-2 pt-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-3.5 w-3.5" />
              {/* <span>{club.members.toLocaleString()} members</span> */}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default ClubCard;
