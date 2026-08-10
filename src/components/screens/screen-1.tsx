import React from "react";
import { useNavigation } from "../../hooks/useNavigation";

export default function Screen1() {
  const { startPurchaseFlow } = useNavigation();

  return (
    <div 
      className="relative flex-1 flex flex-col justify-end bg-cover bg-center select-none w-full h-full"
      style={{ backgroundImage: "url('/images/0.png')" }}
    >
      {/* Invisible clickable overlay taking up the bottom 30% of the screen */}
      <div 
        onClick={startPurchaseFlow}
        className="w-full h-[30%] bg-transparent cursor-pointer z-10"
        aria-label="Tap to Start"
      />
    </div>
  );
}
