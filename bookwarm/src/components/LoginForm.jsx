"use client";
import React from "react";
import { motion } from "framer-motion";


const LoginForm = () => {
  return (
    <form className="text-res flex flex-col max-md:mt-5 max-md:max-w-full max-md:m-10">
      <label className=" self-start ml-5 mt-10 text-black max-md:mt-5">
        E-mail
      </label>
      <input
        type="email"
        placeholder="example@domain.com"
        className="inputbox max-md:max-w-full"
        required
      />

      <label className="self-start mt-3.5 ml-5 text-black ">
        Password
      </label>
      <input
        type="password"
        className="inputbox max-md:max-w-full"
        required
      />

      <motion.button
        type="submit"
        className="px-16 mx-5 py-3 mt-12 text-white bg-blue-800 rounded-xl max-md:px-5 
        max-md:mt-10 max-md:max-w-full hover:bg-pink-500 transition-colors cursor-pointer"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.0 }}
      >
        Sign in
      </motion.button>
    </form>
  );
};

export default LoginForm;
