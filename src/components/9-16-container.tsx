"use client";

import React, { useState, useEffect } from "react";

interface ContainerProps {
  children: React.ReactNode;
}

export default function Container916({ children }: ContainerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const targetWidth = 1080;
      const targetHeight = 1920;
      const scaleX = window.innerWidth / targetWidth;
      const scaleY = window.innerHeight / targetHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 p-0 overflow-hidden select-none">
      <div
        className="relative w-[1080px] h-[1920px] bg-[#FAF8F5] overflow-hidden flex flex-col shadow-2xl select-none flex-shrink-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

