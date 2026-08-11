"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../../context/store";
import { EGG_TRAYS } from "../../utils/constants";
import { CreditCard as CardIcon, Wallet as WalletIcon, Landmark, ChevronRight, Check } from "lucide-react";

export default function Screen5() {
  const { cart, paymentMethod, setPaymentMethod, setScreen, grandTotal } = useAppStore();

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

  // Accordion open/close state
  const [expandedMethod, setExpandedMethod] = useState<"upi" | "card" | "wallet" | "netbanking" | null>(null);

  // UPI states
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [isUpiVerified, setIsUpiVerified] = useState(false);

  // Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  // Wallet states
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Net banking states
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [bankQuery, setBankQuery] = useState("");

  // Payment loading spinner state
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle accordion and sync with store
  const toggleMethod = (method: "upi" | "card" | "wallet" | "netbanking") => {
    if (expandedMethod === method) {
      setExpandedMethod(null);
      setPaymentMethod(null);
    } else {
      setExpandedMethod(method);
      setPaymentMethod(method);
    }
  };

  const amountPayable = grandTotal;

  // Card Network helper
  const getCardType = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (/^(508[5-9]|6521|6522|60)/.test(clean)) return "RuPay";
    return null;
  };

  // Form inputs formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    const formatted = parts.join(" ").slice(0, 19);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      setExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`.slice(0, 5));
    } else {
      setExpiry(v);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
    setCvv(v);
  };

  // Check if current method requirements are met
  const isFormValid = () => {
    if (!expandedMethod) return false;

    if (expandedMethod === "upi") {
      return selectedUpiApp !== null || (upiId.trim().length > 0 && isUpiVerified);
    }

    if (expandedMethod === "card") {
      const cleanNum = cardNumber.replace(/\s/g, "");
      return (
        cleanNum.length === 16 &&
        cardHolder.trim().length > 0 &&
        expiry.length === 5 &&
        cvv.length === 3
      );
    }

    if (expandedMethod === "wallet") {
      return selectedWallet !== null;
    }

    if (expandedMethod === "netbanking") {
      return selectedBank !== null;
    }

    return false;
  };

  const handlePaymentSubmit = async () => {
    if (!isFormValid()) return;

    if (expandedMethod === "upi") {
      setScreen(6); // Navigate to Screen 6 QR Scanner
    } else {
      try {
        setIsProcessing(true);
        const res = await fetch("/api/razorpay/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: amountPayable }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          setIsProcessing(false);
          alert("Failed to initialize Razorpay Order: " + (data.error || "Server error"));
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_THKA9eZTARgpKw",
          amount: Math.round(amountPayable * 100),
          currency: "INR",
          name: "Egg Vending Kiosk",
          description: `Order Payment for ${cart.reduce((s, i) => s + i.quantity, 0)} trays`,
          order_id: data.orderId,
          handler: async function (response: any) {
            setIsProcessing(false);
            const payId = response.razorpay_payment_id;
            const store = useAppStore.getState();
            store.setRazorpayPaymentId(payId);
            
            let finalMethod = "RAZORPAY";
            if (expandedMethod === "card") finalMethod = "CARD";
            else if (expandedMethod === "wallet") finalMethod = "WALLET";
            else if (expandedMethod === "netbanking") finalMethod = "NET BANKING";
            
            store.setPaymentMethod(finalMethod as any);

            try {
              await fetch("/api/payment-status?action=set&status=success");
            } catch (err) {
              console.error("Failed to set payment status to success:", err);
            }

            store.setScreen(7); // Redirect to Screen 7 (Success Page)
          },
          prefill: {
            name: cardHolder || "Vending Customer",
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
    }
  };

  const banksList = [
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Canara Bank",
    "Union Bank",
    "Indian Bank",
    "Punjab National Bank (PNB)",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "Other Banks",
  ];

  const filteredBanks = banksList.filter((bank) =>
    bank.toLowerCase().includes(bankQuery.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#FAF8F5] select-none overflow-hidden pb-24">
      {/* Decorative header - Cursive style with no wood background banner */}
      <div className="pt-20 pb-6 flex justify-center select-none flex-shrink-0">
        <h1 className="text-[72px] text-[#4A2F13] font-serif italic font-extrabold text-center drop-shadow-sm select-none">
          Payment
        </h1>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 select-none min-h-0 pb-40">
        {/* Dashed Border Card */}
        <div className="border-2 border-dashed border-zinc-300 rounded-[36px] bg-white p-8 shadow-sm flex flex-col gap-6 flex-shrink-0">
          
          {/* Amount Payable Display */}
          <div className="flex flex-col items-center text-center pb-6 border-b-2 border-zinc-100">
            <span className="text-[24px] font-bold text-zinc-500">Amount Payable</span>
            <span className="font-black text-[54px] text-amber-950 mt-2">₹{amountPayable.toFixed(2)}</span>
          </div>

          {/* Payment Methods selector (List container style) */}
          <div className="flex flex-col border-2 border-zinc-150 rounded-[24px] overflow-hidden bg-white">
            
            {/* UPI Option Row */}
            <div className="border-b-2 border-zinc-150">
              <button
                onClick={() => toggleMethod("upi")}
                className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center bg-zinc-100/80 rounded-md border-2 border-zinc-200/50 px-2.5 py-1">
                    <span className="font-black italic text-[11px] tracking-tighter text-zinc-700">UPI</span>
                  </div>
                  <span className="font-extrabold text-zinc-800 text-[26px]">Pay via UPI</span>
                </div>
                <ChevronRight className={`w-8 h-8 text-zinc-400 transition-transform ${expandedMethod === "upi" ? "rotate-90" : ""}`} />
              </button>

              {/* UPI Expanded Content */}
              {expandedMethod === "upi" && (
                <div className="px-6 pb-6 pt-1 bg-zinc-50/50 flex flex-col gap-5 border-t-2 border-zinc-50">
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {["Google Pay", "PhonePe", "Paytm", "BHIM UPI", "Amazon Pay UPI", "Other UPI Apps"].map((app) => (
                      <button
                        key={app}
                        onClick={() => {
                          setSelectedUpiApp(app);
                          setIsUpiVerified(false);
                          setUpiId("");
                        }}
                        className={`py-4 px-2 text-center font-black text-[18px] rounded-2xl border-2 transition cursor-pointer ${
                          selectedUpiApp === app
                            ? "border-orange-500 bg-orange-50 text-orange-950 shadow-sm"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5 mt-1">
                    <span className="text-[18px] font-black text-zinc-400 uppercase tracking-widest">OR Enter UPI ID</span>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="username@bank"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setSelectedUpiApp(null);
                          setIsUpiVerified(false);
                        }}
                        className="flex-1 px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[20px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                      />
                      <button
                        onClick={() => {
                          if (upiId.trim()) setIsUpiVerified(true);
                        }}
                        disabled={!upiId.trim() || isUpiVerified}
                        className={`px-6 py-3.5 rounded-2xl font-black text-[18px] border-2 transition cursor-pointer select-none ${
                          isUpiVerified
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        }`}
                      >
                        {isUpiVerified ? "Verified ✓" : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Option Row */}
            <div className="border-b-2 border-zinc-150">
              <button
                onClick={() => toggleMethod("card")}
                className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <CardIcon className="w-8 h-8 text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-zinc-800 text-[26px] leading-none">Card</span>
                    <span className="text-[18px] text-zinc-400 font-semibold mt-1.5">Credit/Debit Cards</span>
                  </div>
                </div>
                <ChevronRight className={`w-8 h-8 text-zinc-400 transition-transform ${expandedMethod === "card" ? "rotate-90" : ""}`} />
              </button>

              {/* Card Expanded Content */}
              {expandedMethod === "card" && (
                <div className="px-6 pb-6 pt-2 bg-zinc-50/50 flex flex-col gap-5 border-t-2 border-zinc-50 text-left">
                  
                  {/* Supported Networks badges */}
                  <div className="flex gap-3 items-center mt-1">
                    <span className="text-[18px] font-black text-zinc-400 uppercase tracking-wide">Supported:</span>
                    <span className={`text-sm px-3 py-1.5 rounded font-black border-2 tracking-wider ${getCardType(cardNumber) === "Visa" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-zinc-400 border-zinc-200"}`}>VISA</span>
                    <span className={`text-sm px-3 py-1.5 rounded font-black border-2 tracking-wider ${getCardType(cardNumber) === "Mastercard" ? "bg-red-500 text-white border-red-500" : "bg-white text-zinc-400 border-zinc-200"}`}>MC</span>
                    <span className={`text-sm px-3 py-1.5 rounded font-black border-2 tracking-wider ${getCardType(cardNumber) === "RuPay" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-zinc-400 border-zinc-200"}`}>RuPay</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[18px] font-black text-zinc-400 uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[20px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[18px] font-black text-zinc-400 uppercase tracking-wider">Card Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[20px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[18px] font-black text-zinc-400 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[20px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[18px] font-black text-zinc-400 uppercase tracking-wider">CVV</label>
                      <input
                        type="password"
                        placeholder="xxx"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[20px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Save Card Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-6 h-6 text-orange-500 border-zinc-350 rounded focus:ring-orange-500"
                    />
                    <span className="text-[18px] font-semibold text-zinc-500 select-none">Save this Card for future purchases (optional)</span>
                  </label>

                </div>
              )}
            </div>

            {/* Wallet Option Row */}
            <div className="border-b-2 border-zinc-150">
              <button
                onClick={() => toggleMethod("wallet")}
                className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <WalletIcon className="w-8 h-8 text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-zinc-800 text-[26px] leading-none">Wallet</span>
                    <span className="text-[18px] text-zinc-400 font-semibold mt-1.5">Phonepe, paytm..</span>
                  </div>
                </div>
                <ChevronRight className={`w-8 h-8 text-zinc-400 transition-transform ${expandedMethod === "wallet" ? "rotate-90" : ""}`} />
              </button>

              {/* Wallet Expanded Content */}
              {expandedMethod === "wallet" && (
                <div className="px-6 pb-6 pt-2 bg-zinc-50/50 flex flex-col gap-4 border-t-2 border-zinc-50">
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {["PhonePe Wallet", "Paytm Wallet", "Amazon Pay Wallet", "Mobikwik", "Freecharge", "Airtel Money"].map((wallet) => (
                      <button
                        key={wallet}
                        onClick={() => setSelectedWallet(wallet)}
                        className={`py-4 px-2 text-center font-black text-[18px] rounded-2xl border-2 transition cursor-pointer ${
                          selectedWallet === wallet
                            ? "border-orange-500 bg-orange-50 text-orange-950 shadow-sm"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Net Banking Option Row */}
            <div>
              <button
                onClick={() => toggleMethod("netbanking")}
                className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Landmark className="w-8 h-8 text-zinc-500" />
                  <span className="font-extrabold text-zinc-800 text-[26px]">Net Banking</span>
                </div>
                <ChevronRight className={`w-8 h-8 text-zinc-400 transition-transform ${expandedMethod === "netbanking" ? "rotate-90" : ""}`} />
              </button>

              {/* Net Banking Expanded Content */}
              {expandedMethod === "netbanking" && (
                <div className="px-6 pb-6 pt-3 bg-zinc-50/50 flex flex-col gap-4 border-t-2 border-zinc-50">
                  
                  {/* Searchable banks input */}
                  <input
                    type="text"
                    placeholder="Search your Bank..."
                    value={bankQuery}
                    onChange={(e) => setBankQuery(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border-2 border-zinc-200 rounded-2xl text-[22px] font-semibold focus:outline-none focus:border-orange-500 text-zinc-800"
                  />

                  {/* Filtered list of banks */}
                  <div className="max-h-64 overflow-y-auto flex flex-col border-2 border-zinc-200/50 rounded-2xl bg-white select-none">
                    {filteredBanks.length === 0 ? (
                      <span className="text-[20px] font-semibold text-zinc-400 p-4 text-center">No banks found</span>
                    ) : (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-left border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50 transition cursor-pointer text-[20px] font-extrabold ${
                            selectedBank === bank ? "bg-orange-50/60 text-orange-950" : "text-zinc-700"
                          }`}
                        >
                          <span>{bank}</span>
                          {selectedBank === bank && <Check className="w-6 h-6 text-orange-500" />}
                        </button>
                      ))
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Razorpay Secured label */}
        <div className="flex justify-center items-center gap-2.5 text-[20px] text-zinc-500 font-extrabold mt-6 select-none">
          <span>Secured by</span>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="w-8 h-8 text-sky-600">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-black text-slate-900 text-[26px] italic tracking-tight">Razorpay</span>
          </div>
        </div>
      </div>

      {/* Bottom Button Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent select-none z-10">
        <button
          onClick={handlePaymentSubmit}
          disabled={!isFormValid() || isProcessing}
          className={`w-full py-5.5 text-white font-extrabold text-[36px] rounded-[24px] shadow-lg border-2 flex items-center justify-center gap-3 transition select-none ${
            isFormValid() && !isProcessing
              ? "bg-[#F97316] hover:bg-orange-600 border-orange-400/50 active:scale-[0.98] cursor-pointer"
              : "bg-orange-400/60 border-orange-300/40 text-white/70 cursor-not-allowed"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing...</span>
            </div>
          ) : (
            <span>Pay ₹{amountPayable.toFixed(2)}</span>
          )}
        </button>
      </div>
      {/* Footer Image matching Screen 5 layout (grass and chick) */}
      <div className="absolute bottom-0 left-0 right-0 h-10 select-none pointer-events-none z-0">
        {/* Grass background */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-10 bg-repeat-x bg-bottom opacity-20"
          style={{ backgroundImage: "url('/images/0.png')", backgroundPosition: "bottom" }}
        />
      </div>

    </div>
  );
}
