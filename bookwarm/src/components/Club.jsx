import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Image from "next/image";

function Club({club, className}) {
  return (
    <div className="">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={("overflow-hidden transition-all hover:shadow-md", className)}>
          <div className="relative aspect-square overflow-hidden">
            <img
              src={club.coverImage}
              alt={club.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="p-4">
            <div className="line-clamp-1 text-base">{club.name}</div>
          </div>
          <div className="flex items-center justify-between p-4 pt-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-3.5 w-3.5" />
              {/* <span>{club.members.toLocaleString()} members</span> */}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Club;
