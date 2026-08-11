"use client";

import React, { useState } from "react";
import { useAppStore } from "../../context/store";
import { EGG_TRAYS } from "../../utils/constants";
import QuantitySelector from "../quantity-selector";
import BottomSheet from "../bottom-sheet";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TrayType } from "../../types";

const TrayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    {/* Outline shape representing a tray/carton lid box */}
    <path d="M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
    <path d="M2 8h20M6 4h12M6 8V4M18 8V4" />
  </svg>
);

export default function Screen3() {
  const { cart, addTrayToCart, removeTrayFromCart, updateQuantity, setScreen, subtotal, platformFee, cgst, sgst, grandTotal } = useAppStore();
  const [warning, setWarning] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Trigger temporary stock warning
  const triggerWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => {
      setWarning(null);
    }, 3000);
  };

  const handleTrayClick = (id: TrayType) => {
    const exists = cart.find((item) => item.id === id);
    if (!exists) {
      addTrayToCart(id);
    } else {
      setIsCartOpen(true);
    }
  };

  // Find quantity in cart
  const getQty = (id: TrayType) => {
    return cart.find((item) => item.id === id)?.quantity || 0;
  };

  // Total trays selected
  const totalTrays = cart.reduce((sum, item) => sum + item.quantity, 0);



  const handleProceedToSummary = () => {
    if (totalTrays === 0) {
      triggerWarning("Please select at least one egg tray");
      return;
    }
    setIsCartOpen(false);
    setScreen(4); // Navigate to Order Summary
  };
  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#FAF8F5] select-none overflow-hidden pb-24">
      {/* Decorative header - Cursive style with no wood background banner */}
      <div className="pt-20 pb-6 flex justify-center select-none flex-shrink-0">
        <h1 className="text-[72px] text-[#4A2F13] font-serif italic font-extrabold text-center drop-shadow-sm select-none">
          Fresh Eggs
        </h1>
      </div>

      {/* Warning Toast */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-8 left-8 right-8 z-50 bg-red-500 text-white px-8 py-5 rounded-[24px] flex items-center gap-4 shadow-lg border border-red-400"
          >
            <AlertCircle className="w-9 h-9 flex-shrink-0" />
            <span className="text-[22px] font-extrabold">{warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main egg tray list */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 select-none pb-40">
        {EGG_TRAYS.map((tray) => {
          const qty = getQty(tray.id);
          const isSelected = qty > 0;

          return (
            <div
              key={tray.id}
              onClick={() => handleTrayClick(tray.id)}
              className={`flex flex-col gap-6 p-8 rounded-[36px] border-2 bg-white select-none transition ${
                isSelected 
                  ? "border-amber-500 shadow-md ring-2 ring-amber-500/20" 
                  : "border-zinc-200/60 shadow-sm hover:border-amber-200 cursor-pointer"
              }`}
            >
              {/* Product Info Row */}
              <div className="flex items-center gap-6 select-none">
                <div className="w-48 h-32 bg-zinc-50 border border-zinc-100 rounded-[24px] overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img
                    src={tray.image}
                    alt={tray.name}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
                <div className="flex-1 flex flex-col select-none">
                  <h3 className="font-extrabold text-[34px] text-zinc-900 leading-tight">
                    {tray.name}
                  </h3>
                  <p className="text-[22px] font-semibold text-zinc-500 mt-2">
                    {tray.description}
                  </p>
                  <p className="font-black text-[48px] text-amber-950 mt-2">
                    ₹{tray.basePrice}
                  </p>
                </div>
              </div>

              {/* Action row (Add to cart / Quantity Selector) */}
              <div className="flex justify-between items-center border-t-2 border-zinc-200/50 pt-5 select-none">
                <span className={`text-[22px] font-extrabold ${tray.id === "bulk" ? "text-red-500" : "text-zinc-450"}`}>
                  {tray.id === "bulk" ? `Low Stock : ${tray.stock}` : `In Stock : ${tray.stock}`}
                </span>
                
                {isSelected ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <QuantitySelector 
                      id={tray.id} 
                      quantity={qty} 
                      onWarning={triggerWarning} 
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addTrayToCart(tray.id);
                    }}
                    className="px-9 py-4.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[24px] rounded-full shadow-md transition select-none cursor-pointer"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Button Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white to-transparent select-none z-20">
        <div className="w-full h-[96px] bg-[#F97316] rounded-[24px] shadow-lg border border-orange-400/50 flex items-center justify-between px-8 py-4 text-white font-extrabold text-2xl select-none">
          {/* Left Side: Icon and Count */}
          <div className="flex items-center gap-3.5 pl-2">
            <TrayIcon className="w-10 h-10 text-white" />
            <span className="text-[32px] tracking-wide">{totalTrays} {totalTrays === 1 ? "Tray" : "Trays"}</span>
          </div>

          {/* Vertical Separator */}
          <div className="h-12 w-px bg-white/30" />

          {/* Right Side: View Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/35 active:scale-95 transition px-8 py-4.5 rounded-[16px] text-white select-none cursor-pointer"
          >
            <span className="text-[24px] font-extrabold">View Cart</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Cart Drawer */}
      <BottomSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center gap-3 select-none">
            <p className="text-zinc-500 font-extrabold text-[32px]">Your cart is empty</p>
            <p className="text-zinc-400 text-[24px]">Select an egg tray above to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 select-none">
            {/* Cart item list */}
            <div className="flex flex-col gap-5">
              {cart.map((item) => {
                const tray = EGG_TRAYS.find((t) => t.id === item.id);
                if (!tray) return null;

                return (
                  <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-20 bg-zinc-50 border border-zinc-100 rounded-[16px] overflow-hidden flex-shrink-0">
                        <img src={tray.image} alt={tray.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[26px] text-zinc-900 leading-none">{tray.name}</span>
                        <span className="font-black text-amber-950 text-[30px] mt-2">₹{tray.basePrice * item.quantity}</span>
                      </div>
                    </div>
                    <QuantitySelector 
                      id={item.id} 
                      quantity={item.quantity} 
                      onWarning={triggerWarning} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Price Details */}
            <div className="bg-zinc-50 rounded-[24px] p-8 flex flex-col gap-3 border border-zinc-100 select-none">
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
              <div className="flex justify-between font-black text-[34px] text-amber-950 border-t-2 border-zinc-100 pt-3.5">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToSummary}
              className="w-full py-6 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[30px] rounded-[20px] shadow-md transition select-none cursor-pointer"
            >
              Proceed to Summary
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
