"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { TrayType } from "../types";
import { useAppStore } from "../context/store";

interface QuantitySelectorProps {
  id: TrayType;
  quantity: number;
  onWarning: (msg: string) => void;
}

export default function QuantitySelector({ id, quantity, onWarning }: QuantitySelectorProps) {
  const { updateQuantity } = useAppStore();

  const handleDecrease = () => {
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    const result = updateQuantity(id, quantity + 1);
    if (!result.success && result.message) {
      onWarning(result.message);
    }
  };

  return (
    <div className="flex items-center bg-zinc-100 border border-zinc-200/50 rounded-full p-1.5 select-none w-[180px] justify-between">
      {/* Decrement Button */}
      <button
        onClick={handleDecrease}
        disabled={quantity <= 0}
        className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-90 cursor-pointer"
      >
        <Minus className="w-6 h-6 stroke-[3.5]" />
      </button>

      {/* Display Value */}
      <span className="text-[24px] font-black text-zinc-900 text-center">
        {String(quantity).padStart(2, "0")}
      </span>

      {/* Increment Button */}
      <button
        onClick={handleIncrease}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F97316] text-white hover:bg-orange-600 transition active:scale-90 cursor-pointer shadow-sm"
      >
        <Plus className="w-6 h-6 stroke-[3.5]" />
      </button>
    </div>
  );
}
