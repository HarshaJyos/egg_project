"use client";

import React from "react";
import DoorAnimation from "../door-animation";

export default function Screen7() {
  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#FAF8F5] select-none overflow-hidden pb-24">
      {/* Decorative header - Cursive style with no wood background banner */}
      <div className="pt-16 pb-4 flex justify-center select-none flex-shrink-0">
        <h1 className="text-6xl text-[#4A2F13] font-serif italic font-extrabold text-center drop-shadow-sm select-none">
          Payment Successful
        </h1>
      </div>

      {/* Main Content containing Door Anim cards */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Door Cards controls */}
        <DoorAnimation />
      </div>
    </div>
  );
}
