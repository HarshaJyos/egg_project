"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../context/store";
import { useNavigation } from "../hooks/useNavigation";
import { EGG_TRAYS } from "../utils/constants";
import { CheckCircle2, Receipt } from "lucide-react";
import { motion } from "framer-motion";

export default function DoorAnimation() {
  const { cart, paymentMethod, razorpayPaymentId, doorStatus, setDoorStatus, grandTotal } = useAppStore();
  const { navigateToHome } = useNavigation();

  const [openProgress, setOpenProgress] = useState(0);
  const [closeProgress, setCloseProgress] = useState(0);

  const [formattedDateTime, setFormattedDateTime] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // Initialize date-time and transaction ID
  useEffect(() => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    setFormattedDateTime(`${month} ${day}, ${year} | ${hours}:${minutes} ${ampm}`);
    
    if (razorpayPaymentId) {
      setTransactionId(razorpayPaymentId);
    } else {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      setTransactionId(`EGG${year}${String(now.getMonth() + 1).padStart(2, "0")}${String(day).padStart(2, "0")}${randomSuffix}`);
    }
  }, [razorpayPaymentId]);

  // Open door timer progress
  useEffect(() => {
    if (doorStatus === "opening") {
      let current = 0;
      const duration = 1200; // 1.2 seconds Snappy open
      const step = 30;
      const interval = setInterval(() => {
        current += step;
        const nextProgress = Math.min((current / duration) * 100, 100);
        setOpenProgress(nextProgress);
        if (current >= duration) {
          clearInterval(interval);
          setDoorStatus("open");
        }
      }, step);
      return () => clearInterval(interval);
    }
  }, [doorStatus, setDoorStatus]);

  // Close door timer progress
  useEffect(() => {
    if (doorStatus === "closing") {
      let current = 0;
      const duration = 1200; // 1.2 seconds Snappy close
      const step = 30;
      const interval = setInterval(() => {
        current += step;
        const nextProgress = Math.min((current / duration) * 100, 100);
        setCloseProgress(nextProgress);
        if (current >= duration) {
          clearInterval(interval);
          setDoorStatus("closed-success");
        }
      }, step);
      return () => clearInterval(interval);
    }
  }, [doorStatus, setDoorStatus]);

  const handleOpenDoor = () => {
    if (doorStatus === "closed") {
      setDoorStatus("opening");
    }
  };

  const handleCloseDoor = () => {
    if (doorStatus === "open") {
      setDoorStatus("closing");
    }
  };

  const amountPaid = grandTotal;

  // 3D Rotation angles based on progress state
  const openRotateY = -105 * (openProgress / 100);
  const closeRotateY = -105 * (1 - closeProgress / 100);

  return (
    <div className="flex flex-col gap-6 w-full px-5 py-2 select-none pb-32">
      
      {/* CARD 1: Payment Details summary box */}
      <div className="bg-white border-2 border-zinc-200 rounded-[36px] p-8 shadow-sm flex flex-col items-center">
        {/* Big green success checkmark with surrounding decorative lines */}
        <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-md mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-10 h-10 text-white">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Ticks on outside decoration */}
          <div className="absolute -top-1.5 -left-1.5 w-4 h-1 bg-emerald-400 rotate-[45deg] rounded" />
          <div className="absolute -top-1.5 -right-1.5 w-4 h-1 bg-emerald-400 rotate-[-45deg] rounded" />
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-1 bg-emerald-400 rotate-[-45deg] rounded" />
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-1 bg-emerald-400 rotate-[45deg] rounded" />
        </div>

        <h3 className="font-black text-[36px] text-zinc-900 leading-none">Payment Successful!</h3>
        <span className="text-[22px] font-extrabold text-zinc-500 text-center mt-4">
          Thank you for your payment.
        </span>
        <span className="text-[22px] font-extrabold text-zinc-500 text-center mt-1.5">
          Your eggs will be dispensed shortly.
        </span>

        {/* Separator line */}
        <div className="w-full h-px bg-zinc-200 my-6" />

        {/* Payment Details header list */}
        <div className="w-full flex flex-col gap-4 text-left">
          <div className="flex items-center gap-3 mb-1.5">
            <Receipt className="w-7 h-7 text-zinc-400" />
            <span className="text-[24px] font-black text-zinc-800 uppercase tracking-wider">Payment Details</span>
          </div>

          <div className="flex justify-between items-center text-[22px] font-extrabold">
            <span className="text-zinc-400">Transaction ID</span>
            <span className="text-zinc-800 font-extrabold font-mono text-base">{transactionId}</span>
          </div>

          <div className="flex justify-between items-center text-[22px] font-extrabold">
            <span className="text-zinc-400">Date & Time</span>
            <span className="text-zinc-800">{formattedDateTime}</span>
          </div>

          <div className="flex justify-between items-center text-[22px] font-extrabold">
            <span className="text-zinc-400">Amount Paid</span>
            <span className="text-emerald-600 font-black text-[26px]">₹{amountPaid.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-[22px] font-extrabold">
            <span className="text-zinc-400">Payment Method</span>
            <span className="text-zinc-800 uppercase tracking-widest">{paymentMethod || "UPI"}</span>
          </div>
        </div>
      </div>
      
      {/* CARD 2: Open Door */}
      <button
        onClick={handleOpenDoor}
        disabled={doorStatus !== "closed"}
        className={`flex items-center gap-8 p-8 rounded-[36px] bg-white border-2 border-zinc-200 text-left transition select-none ${
          doorStatus === "closed" 
            ? "shadow-md cursor-pointer hover:border-orange-200 active:scale-[0.98]" 
            : "shadow-sm opacity-90 cursor-default"
        }`}
      >
        {/* Left Side: Vending Machine with 3D Flap Door Overlay */}
        <div 
          className="relative w-36 h-48 bg-zinc-50 border border-zinc-200/50 rounded-3xl flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5 shadow-inner"
          style={{ perspective: "150px" }}
        >
          <img 
            src="/images/page_7_img_2.png" 
            alt="Vending Machine Closed" 
            className="w-full h-full object-contain select-none pointer-events-none" 
          />
          {/* Overlay swing flap door */}
          <motion.div
            style={{ transformOrigin: "left center" }}
            animate={{ 
              rotateY: doorStatus === "closed" 
                ? 0 
                : doorStatus === "opening" 
                  ? openRotateY 
                  : -105 
            }}
            transition={{ ease: "linear", duration: 0 }}
            className="absolute bottom-[9%] left-[18%] w-[42%] h-[18%] bg-[#E8DCD1] border border-[#8B7C6E] rounded-sm shadow-sm flex items-center justify-end pr-0.5"
          >
            <div className="w-1.5 h-2.5 bg-[#8B7C6E] rounded-full" />
          </motion.div>
        </div>
        
        {/* Right Side: Text description */}
        <div className="flex flex-col gap-1.5 select-none">
          <span className="font-black text-[32px] text-zinc-900 leading-tight">Open Door</span>
          <span className="text-[20px] font-extrabold text-zinc-400 mt-2">Pull the Door to Open</span>
        </div>
      </button>

      {/* CARD 3: Close Door */}
      <button
        onClick={handleCloseDoor}
        disabled={doorStatus !== "open"}
        className={`flex items-center gap-8 p-8 rounded-[36px] bg-white border-2 border-zinc-200 text-left transition select-none ${
          doorStatus === "open"
            ? "shadow-md cursor-pointer hover:border-orange-200 active:scale-[0.98]"
            : "shadow-sm opacity-50 cursor-default"
        }`}
      >
        {/* Left Side: Vending Machine with 3D Flap Door Overlay */}
        <div 
          className="relative w-36 h-48 bg-zinc-50 border border-zinc-200/50 rounded-3xl flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5 shadow-inner"
          style={{ perspective: "150px" }}
        >
          <img 
            src="/images/page_7_img_2.png" 
            alt="Vending Machine Open" 
            className="w-full h-full object-contain select-none pointer-events-none" 
          />
          {/* Overlay swing flap door */}
          <motion.div
            style={{ transformOrigin: "left center" }}
            animate={{ 
              rotateY: doorStatus === "closed"
                ? 0
                : doorStatus === "open"
                  ? -105
                  : doorStatus === "closing"
                    ? closeRotateY
                    : 0
            }}
            transition={{ ease: "linear", duration: 0 }}
            className="absolute bottom-[9%] left-[18%] w-[42%] h-[18%] bg-[#E8DCD1] border border-[#8B7C6E] rounded-sm shadow-sm flex items-center justify-end pr-0.5"
          >
            <div className="w-1.5 h-2.5 bg-[#8B7C6E] rounded-full" />
          </motion.div>
        </div>
        
        {/* Right Side: Text description */}
        <div className="flex flex-col gap-1.5 select-none">
          <span className="font-black text-[32px] text-zinc-900 leading-tight">Close Door</span>
          <span className="text-[20px] font-extrabold text-zinc-400 mt-2">Push the Door Firmly to Close</span>
        </div>
      </button>

      {/* Success Dialog overlay */}
      {doorStatus === "closed-success" && (
        <div className="flex flex-col items-center justify-center text-center gap-6 bg-emerald-50/90 border border-emerald-200 rounded-[36px] p-8 mt-6 shadow-inner animate-fade-in">
          <CheckCircle2 className="w-18 h-18 text-emerald-600 animate-pulse" />
          <div>
            <h4 className="font-black text-[32px] text-emerald-950">Door Closed Successfully</h4>
            <p className="text-[24px] font-extrabold text-emerald-800 mt-1">Thank you for your purchase!</p>
          </div>
          <button
            onClick={navigateToHome}
            className="w-full py-6 rounded-[24px] bg-orange-500 text-white font-extrabold text-[24px] hover:bg-orange-600 transition shadow-md active:scale-[0.98] cursor-pointer"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  );
}
