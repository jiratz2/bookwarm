import React from "react";
import { motion } from "framer-motion";

function RegisterForm() {
  return (
    <form className="text-res flex flex-col max-md:mt-5 max-md:max-w-full">
      <label className="self-start ml-5 mt-10 text-xl text-black max-md:mt-5">
        E-mail
      </label>
      <input
        type="email"
        placeholder="Example@domain.com"
        className="inputbox max-md:max-w-full text-lg"
      />

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Display Name
      </label>
      <input
        type="text"
        placeholder="Your display name"
        className="inputbox max-md:max-w-full text-lg"
      />

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Password
      </label>
      <input
        type="password"
        className="inputbox max-md:max-w-full text-lg"
        required
      />

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Confirm Password
      </label>
      <input
        type="password"
        className="inputbox max-md:max-w-full text-lg"
        required
      />

      <motion.button
        type="submit"
        className="px-16 mx-5 py-3 mt-12 text-xl text-white bg-blue-800 rounded-xl max-md:px-5 
        max-md:mt-10 max-md:max-w-full hover:bg-pink-500 transition-colors cursor-pointer"
        whileTap={{scale: 0.9}}
        whileHover={{scale:1.0}}
      >
        Register
        </motion.button>
    </form>
  );
}

export default RegisterForm;
