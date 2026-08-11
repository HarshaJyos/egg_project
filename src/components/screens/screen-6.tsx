"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "../../context/store";
import { EGG_TRAYS } from "../../utils/constants";

export default function Screen6() {
  const { cart, setScreen, grandTotal } = useAppStore();
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">("PENDING");

  const amount = grandTotal;

  // Initialize status on mount and poll server status
  useEffect(() => {
    const initializePayment = async () => {
      try {
        await fetch("/api/payment-status?action=set&status=PENDING");
      } catch (e) {
        console.error("Failed to initialize payment:", e);
      }
    };
    initializePayment();

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/payment-status");
        const data = await res.json();
        const status = data.status ? data.status.toUpperCase() : "";
        if (status === "SUCCESS") {
          setPaymentStatus("SUCCESS");
          clearInterval(interval);
          setScreen(7); // Proceed to Screen 7 (Success Page)
        } else if (status === "FAILED" || status === "FAIL") {
          setPaymentStatus("FAILED");
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [setScreen]);

  const retryPayment = async () => {
    setPaymentStatus("PENDING");
    try {
      await fetch("/api/payment-status?action=set&status=PENDING");
    } catch (e) {
      console.error("Failed to reset payment status:", e);
    }
  };

  const handleCancel = async () => {
    try {
      await fetch("/api/payment-status?action=set&status=PENDING");
    } catch (e) {
      console.error("Failed to reset payment status on cancel:", e);
    }
    setScreen(5); // Go back to Payment page
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#FAF8F5] select-none overflow-hidden pb-24">
      {/* Decorative header - Cursive style with no wood background banner */}
      <div className="pt-20 pb-6 flex flex-col items-center justify-center select-none flex-shrink-0">
        <h1 className="text-[72px] text-[#4A2F13] font-serif italic font-extrabold text-center drop-shadow-sm select-none">
          Scan & Pay
        </h1>
        <div className="flex flex-col items-center justify-center text-center mt-4">
          <span className="text-[26px] font-extrabold text-zinc-800 leading-snug">Scan QR code using</span>
          <span className="text-[26px] font-extrabold text-zinc-800 leading-snug">any UPI app</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10 select-none min-h-0 pb-40">
        
        {/* QR Code Dashed Card */}
        <div className="border-2 border-dashed border-zinc-300 rounded-[36px] bg-white p-9 shadow-sm flex items-center justify-center w-[480px] h-[480px]">
          <img 
            src="/images/page_6_img_2.png" 
            alt="Payment QR Code" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Amount & Status Block */}
        <div className="flex flex-col items-center text-center flex-shrink-0">
          <span className="text-[22px] font-black text-[#4A2F13]/70 uppercase tracking-widest">Amount</span>
          <span className="font-black text-[64px] text-[#4A2F13] mt-1.5">₹{amount.toFixed(2)}</span>
          
          {paymentStatus === "FAILED" ? (
            <div className="flex flex-col items-center mt-5">
              <span className="text-[24px] font-black text-red-500 tracking-wide">
                Payment Failed or Cancelled
              </span>
              <button
                onClick={retryPayment}
                className="text-[20px] font-extrabold text-orange-500 hover:text-orange-600 underline mt-3.5 cursor-pointer select-none"
              >
                Tap to Retry Payment
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-black text-zinc-500 mt-6 tracking-wide animate-pulse">
                Waiting for the Payment...
              </span>
              <span className="text-[18px] font-semibold text-zinc-400 mt-2.5">
                Please Don't Close the Screen
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cancel Button Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent select-none z-10">
        <button
          onClick={handleCancel}
          className="w-full py-6 bg-[#FDBA74] hover:bg-orange-400 active:scale-[0.98] text-white font-extrabold text-[36px] rounded-3xl shadow transition select-none cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
