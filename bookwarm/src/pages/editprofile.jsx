import React from "react";

export default function editprofile() {
  return (
    <div className="mt-[100px]">
      <h1>Edit your profile</h1>

      <div className="w-full h-[200px] bg-gray-200"></div>
      <div className="w-[200px] h-[200px] rounded-full bg-gray-300"></div>

      <div className="flex flex-col m-10 w-2xl">
        <label htmlFor="">Display Name</label>
        <input type="text" className="inputboxprimary" />

        <label htmlFor="">Bio</label>
        <input type="text" className="inputboxprimary" />

        <label htmlFor="">Gender</label>
        <input type="text" className="inputboxprimary" />

        <label htmlFor="">Date of birth</label>
        <input type="text" className="inputboxprimary" />

        <label htmlFor="">E-mail</label>
        <input type="text" className="inputboxprimary" />

        <label htmlFor="">Phone number</label>
        <input type="text" className="inputboxprimary" />

        <button className="cancelbutton my-2">Cancel</button>
        <button className="button">Save</button>
      </div>
    </div>
  );
}
