import React from "react";
import { useNavigation } from "../../hooks/useNavigation";
import { motion } from "framer-motion";

export default function Screen1() {
  const { startPurchaseFlow } = useNavigation();

  return (
    <div 
      className="relative flex-1 flex flex-col justify-between p-6 bg-cover bg-center select-none"
      style={{ backgroundImage: "url('/images/0.png')" }}
    >
      {/* Space above the board */}
      <div className="mt-8" />

      {/* Visible premium clickable button */}
      <div className="mb-12 w-full flex justify-center z-10">
        <motion.button
          onClick={startPurchaseFlow}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0px 0px 0px rgba(249, 115, 22, 0.2)",
              "0px 0px 25px rgba(249, 115, 22, 0.7)",
              "0px 0px 0px rgba(249, 115, 22, 0.2)"
            ]
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="w-full max-w-[340px] h-20 bg-gradient-to-r from-orange-500 to-amber-500 border border-orange-400 rounded-3xl text-white font-extrabold text-2xl tracking-widest uppercase shadow-lg select-none cursor-pointer flex items-center justify-center gap-3 transition-colors duration-200"
        >
          <span>Tap to Start</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 animate-pulse">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
