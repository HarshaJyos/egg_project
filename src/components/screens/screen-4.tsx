"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../../context/store";
import { EGG_TRAYS } from "../../utils/constants";
import { ArrowLeft, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const SwipeButton = ({ onSwipe, disabled }: { onSwipe: () => void; disabled: boolean }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div 
      onClick={disabled ? undefined : onSwipe}
      className={`w-full max-w-[420px] h-20 bg-orange-100 border-2 border-orange-200 rounded-3xl relative flex items-center justify-between px-2 select-none overflow-hidden shadow-inner cursor-pointer ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Background slide progress color */}
      <div className="absolute inset-0 bg-[#F97316] opacity-10" />

      {/* Track Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[24px] font-black text-orange-950 uppercase tracking-widest animate-pulse">
          Swipe to Pay
        </span>
      </div>

      {/* Draggable handle */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: 330 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={(event, info) => {
          if (info.offset.x >= 280) {
            setIsCompleted(true);
            onSwipe();
          }
        }}
        className="w-16 h-16 bg-[#F97316] hover:bg-orange-600 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md z-10 text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </motion.div>

      {/* End Target Indicator */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#F97316] opacity-40 pr-2 pointer-events-none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </div>
    </div>
  );
};

export default function Screen4() {
  const { cart, setScreen, subtotal, platformFee, cgst, sgst, grandTotal } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay Script dynamically on mount
  useEffect(() => {
    const scriptId = "razorpay-checkout-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        document.body.removeChild(existing);
      }
    };
  }, []);

  const handleBack = () => {
    setScreen(3);
  };



  const handleProceed = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessing(true);
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: grandTotal }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setIsProcessing(false);
        alert("Failed to initialize Razorpay Order: " + (data.error || "Server error"));
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_THKA9eZTARgpKw",
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        name: "Egg Vending Kiosk",
        description: `Payment for ${cart.reduce((s, i) => s + i.quantity, 0)} egg trays`,
        order_id: data.orderId,
        handler: async function (response: any) {
          setIsProcessing(false);
          const payId = response.razorpay_payment_id;
          const store = useAppStore.getState();
          store.setRazorpayPaymentId(payId);
          store.setPaymentMethod("RAZORPAY" as any);
          
          try {
            await fetch("/api/payment-status?action=set&status=success");
          } catch (err) {
            console.error("Failed to set payment status to success:", err);
          }

          store.setScreen(7); // Go directly to Screen 7 (Success Page)
        },
        prefill: {
          name: "Vending Customer",
          email: "customer@eggvending.com",
          contact: "9876543210"
        },
        theme: {
          color: "#F97316"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      setIsProcessing(false);
      console.error("Razorpay Checkout Error:", e);
      alert("Could not load Razorpay Checkout Modal.");
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#FAF8F5] select-none overflow-hidden pb-24">
      {/* Dynamic Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 select-none">
          <div className="w-20 h-20 rounded-full border-6 border-orange-500 border-t-transparent animate-spin mb-4" />
          <span className="text-white font-extrabold text-[30px] animate-pulse tracking-wide">
            Initiating Payment...
          </span>
          <span className="text-zinc-300 font-semibold text-[20px] mt-3">
            Please do not close or reload
          </span>
        </div>
      )}

      {/* Decorative header - Cursive style with no wood background banner */}
      <div className="pt-20 pb-6 flex justify-center select-none flex-shrink-0">
        <h1 className="text-[72px] text-[#4A2F13] font-serif italic font-extrabold text-center drop-shadow-sm select-none">
          Fresh Eggs
        </h1>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 select-none min-h-0 pb-40">
        {/* Order Summary Card */}
        <div className="bg-white border-2 border-zinc-200/50 rounded-[36px] p-8 shadow-md flex flex-col gap-6 flex-shrink-0">
          <h3 className="font-extrabold text-[30px] text-zinc-900 border-b-2 border-zinc-50 pb-4">
            Order Summary
          </h3>
          
          {cart.length === 0 ? (
            <p className="text-zinc-500 font-semibold text-center py-6 text-[24px]">No items in cart</p>
          ) : (
            <div className="flex flex-col gap-6">
              {cart.map((item) => {
                const tray = EGG_TRAYS.find((t) => t.id === item.id);
                if (!tray) return null;

                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-20 bg-zinc-50 border border-zinc-100 rounded-[16px] overflow-hidden flex-shrink-0">
                        <img src={tray.image} alt={tray.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[26px] text-zinc-900 leading-none">{tray.name}</span>
                        <span className="text-[18px] font-semibold text-zinc-400 mt-1.5">{tray.description}</span>
                        <span className="font-black text-[24px] text-zinc-900 mt-2">₹{tray.basePrice}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-zinc-800 text-[32px]">x{item.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add More Button */}
          <button
            onClick={handleBack}
            className="self-end px-8 py-3.5 rounded-full bg-[#F97316] text-white font-extrabold text-[20px] hover:bg-orange-600 active:scale-95 transition mt-2 cursor-pointer shadow-sm"
          >
            Add More
          </button>
        </div>

        {/* Price Details Card (Dashed Border Card) */}
        <div className="border-2 border-dashed border-zinc-300 rounded-[36px] p-8 bg-white shadow-sm flex flex-col gap-4 flex-shrink-0">
          <h3 className="font-extrabold text-[30px] text-zinc-900 border-b-2 border-zinc-50 pb-4">
            Price Details
          </h3>
          <div className="flex flex-col gap-4">
            {cart.map((item) => {
              const tray = EGG_TRAYS.find((t) => t.id === item.id);
              if (!tray) return null;
              return (
                <div key={item.id} className="flex justify-between font-semibold text-[22px] text-zinc-500">
                  <span>{tray.name} (x{item.quantity})</span>
                  <span>₹{tray.basePrice * item.quantity}</span>
                </div>
              );
            })}
            <div className="h-px bg-zinc-100 my-4" />
            <div className="flex justify-between font-semibold text-[22px] text-zinc-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[22px] text-zinc-500">
              <span>Platform Fee</span>
              <span>₹{platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[22px] text-zinc-500">
              <span>CGST (2.5%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[22px] text-zinc-500">
              <span>SGST (2.5%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Display Outside Dashed Card */}
        <div className="flex justify-between items-center px-6 flex-shrink-0">
          <span className="font-black text-[36px] text-zinc-800">Total</span>
          <span className="font-black text-[48px] text-zinc-900">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Bottom Swipe Button Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent select-none z-10 flex justify-center">
        <SwipeButton onSwipe={handleProceed} disabled={isProcessing || cart.length === 0} />
      </div>
    </div>
  );
}
