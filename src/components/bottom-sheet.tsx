"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  // Prevent scrolling parent element when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay / Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Bottom Sheet container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="absolute bottom-0 left-0 right-0 h-[50%] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] z-50 flex flex-col overflow-hidden"
          >
            {/* Drag Handle Bar */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
              <div className="w-20 h-2.5 rounded-full bg-zinc-300" />
            </div>

            {/* Header with Close Icon */}
            <div className="px-8 flex justify-between items-center border-b border-zinc-100 pb-5">
              <h3 className="text-3xl font-black text-zinc-900">Your Cart</h3>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition active:scale-95"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Sheet Body (scrollable content) */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
