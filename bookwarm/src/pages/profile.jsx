import React from "react";

export default function profile() {
  return (
    <div className="mt-[100px] font-bold text-black">
      <div className="bg-amber-200 h-[150] w-full"></div>
      <div className="flex justify-evenly">
        <div className="bg-blue-400 h-[120px] w-[120px] rounded-full"></div>
        <div className="flex flex-col">
          <h2 className="text-2xl">LAUPEGON</h2>
          <p className="font-light">
            Full | Driving house with dirty bassline, huge beats, soulful male
            vocal, vocal FX & heavy synths. L
          </p>
        </div>

        <button className="button">Edit profile</button>
      </div>

      <div  className="mx-[140px] mt-10">
        <h2>Reading stats</h2>
        <div className="flex justify-evenly py-15">
          <div className="reading-stats">
            <p>0</p>
            <h3>Books read</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Authors</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Club joined</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Archievements</h3>
          </div>
        </div>

        <div className="flex justify-between ">
          <h2>Book shelf</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[83px] h-[113px] my-5"></div>

        <div className="flex justify-between ">
          <h2>Clubs</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[140px] h-[170px] my-5"></div>

        <div className="flex justify-between ">
          <h2>Archievements</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[130px] h-[130px] my-5"></div>
      </div>
    </div>
  );
}
