"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { motion } from "framer-motion";

const AuthForm = () => {
  const [activeTab, setActiveTab] = useState("sign in");

  return (
    <div className="font-bold">
      {/* ปุ่มเลือก Sign in / Register */}
      <div className="flex gap-10 justify-center text-2xl text-center">
        <button
          type="button"
          onClick={() => setActiveTab("sign in")}
          className={`flex flex-col items-center ${
            activeTab === "sign in" ? "text-black" : "text-neutral-400"
          }`}
        >

          <span className="cursor-pointer">Sign in</span>
          {activeTab === "sign in" && (
            <motion.div className="bg-blue-800 h-[5px] w-[120px] mt-1"
            layout
            initial={{  opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`flex flex-col items-center ${
            activeTab === "register" ? "text-black" : "text-neutral-400"
          }`}
        >
          <span className="cursor-pointer">Register</span>
          {activeTab === "register" && (
            <motion.div 
            className="bg-blue-800 h-[5px] w-[120px] mt-1"
            layout
            initial={{  opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
           />
          )}
        </button>
      </div>

      {/* แสดงฟอร์มตามที่เลือก */}
      <div className="">
        {activeTab === "sign in" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
};

export default AuthForm;
