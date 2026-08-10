"use client";

import React from "react";
import { useNavigation } from "../../hooks/useNavigation";

export default function Screen1() {
  const { startPurchaseFlow } = useNavigation();

  return (
    <div 
      onClick={startPurchaseFlow}
      className="relative flex-1 flex flex-col justify-between p-6 bg-cover bg-center select-none cursor-pointer"
      style={{ backgroundImage: "url('/images/0.png')" }}
    >
      {/* Space above the board */}
      <div className="mt-8" />

      {/* Invisible clickable overlay button matching the background image's baked Tap to Start button */}
      <div className="mb-6 w-full flex justify-center">
        <button
          className="w-full max-w-[310px] h-16 bg-transparent border-none outline-none select-none pointer-events-none"
          aria-label="Tap to Start"
        />
      </div>
    </div>
  );
}
