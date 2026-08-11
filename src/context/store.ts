import { create } from "zustand";
import { TrayType, CartItem, PaymentMethod, DoorStatus, CardDetails } from "../types";
import { EGG_TRAYS } from "../utils/constants";

export interface AppState {
  currentScreen: number;
  cart: CartItem[];
  stock: Record<TrayType, number>;
  paymentMethod: PaymentMethod | null;
  paymentSubOption: string | null;
  upiId: string;
  cardDetails: CardDetails;
  doorStatus: DoorStatus;
  isAdActive: boolean;
  adIndex: number;
  razorpayPaymentId: string;
  
  // Centralized calculations (BookMyShow-style)
  subtotal: number;
  platformFee: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  
  // Navigation
  setScreen: (screen: number) => void;
  setAdActive: (active: boolean) => void;
  setAdIndex: (idx: number) => void;
  
  // Cart Actions
  addTrayToCart: (id: TrayType) => void;
  removeTrayFromCart: (id: TrayType) => void;
  updateQuantity: (id: TrayType, qty: number) => { success: boolean; message?: string };
  
  // Payment Actions
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPaymentSubOption: (option: string | null) => void;
  setUpiId: (id: string) => void;
  setCardDetails: (details: Partial<CardDetails>) => void;
  setRazorpayPaymentId: (id: string) => void;
  
  // Door Actions
  setDoorStatus: (status: DoorStatus) => void;
  
  // Reset Actions
  resetCart: () => void;
  resetAll: () => void;
}

const initialCardDetails: CardDetails = {
  cardNumber: "",
  expiry: "",
  cvv: "",
  cardHolder: "",
};

const PLATFORM_FEE = 2.00; // BookMyShow-style flat platform fee

const calculateTotals = (cart: CartItem[]) => {
  const subtotal = cart.reduce((total, item) => {
    const tray = EGG_TRAYS.find((t) => t.id === item.id);
    return total + (tray ? tray.basePrice * item.quantity : 0);
  }, 0);
  
  if (subtotal === 0) {
    return { subtotal: 0, platformFee: 0, cgst: 0, sgst: 0, grandTotal: 0 };
  }
  
  const platformFee = PLATFORM_FEE;
  const taxableAmount = subtotal + platformFee;
  
  // CGST 2.5% and SGST 2.5%
  const cgst = Math.round(taxableAmount * 0.025 * 100) / 100;
  const sgst = Math.round(taxableAmount * 0.025 * 100) / 100;
  
  const grandTotal = Math.round((taxableAmount + cgst + sgst) * 100) / 100;
  
  return { subtotal, platformFee, cgst, sgst, grandTotal };
};

export const useAppStore = create<AppState>((set, get) => ({
  currentScreen: 1,
  cart: [],
  stock: {
    mini: 40,
    medium: 40,
    bulk: 7,
  },
  paymentMethod: null,
  paymentSubOption: null,
  upiId: "",
  cardDetails: initialCardDetails,
  doorStatus: "closed",
  isAdActive: true, // starts with fullscreen advertisement
  adIndex: 0,
  razorpayPaymentId: "",
  
  // Centralized calculations initial state
  subtotal: 0,
  platformFee: 0,
  cgst: 0,
  sgst: 0,
  grandTotal: 0,

  setScreen: (screen) => set({ currentScreen: screen }),
  setAdActive: (active) => set({ isAdActive: active }),
  setAdIndex: (idx) => set({ adIndex: idx }),

  addTrayToCart: (id) => set((state) => {
    const exists = state.cart.find((item) => item.id === id);
    if (exists) return {};
    if (state.stock[id] < 1) return {};
    
    const newCart = [...state.cart, { id, quantity: 1 }];
    const totals = calculateTotals(newCart);
    return {
      cart: newCart,
      ...totals
    };
  }),

  removeTrayFromCart: (id) => set((state) => {
    const newCart = state.cart.filter((item) => item.id !== id);
    const totals = calculateTotals(newCart);
    return {
      cart: newCart,
      ...totals
    };
  }),

  updateQuantity: (id, qty) => {
    const state = get();
    const stockLimit = state.stock[id];
    
    if (qty < 0) return { success: false, message: "Quantity cannot go below zero" };
    if (qty > stockLimit) {
      const name = id === "mini" ? "Mini" : id === "medium" ? "Medium" : "Bulk";
      return { 
        success: false, 
        message: `Only ${stockLimit} ${name} Trays Available` 
      };
    }

    set((state) => {
      const exists = state.cart.find((item) => item.id === id);
      let newCart = [...state.cart];
      
      if (exists) {
        if (qty === 0) {
          newCart = state.cart.filter((item) => item.id !== id);
        } else {
          newCart = state.cart.map((item) => 
            item.id === id ? { ...item, quantity: qty } : item
          );
        }
      } else if (qty > 0) {
        newCart.push({ id, quantity: qty });
      }
      
      const totals = calculateTotals(newCart);
      return { 
        cart: newCart,
        ...totals
      };
    });
    
    return { success: true };
  },

  setPaymentMethod: (method) => set({ paymentMethod: method, paymentSubOption: null }),
  setPaymentSubOption: (option) => set({ paymentSubOption: option }),
  setUpiId: (id) => set({ upiId: id }),
  setCardDetails: (details) => set((state) => ({
    cardDetails: { ...state.cardDetails, ...details },
  })),
  setRazorpayPaymentId: (id) => set({ razorpayPaymentId: id }),

  setDoorStatus: (status) => set({ doorStatus: status }),

  resetCart: () => set({ cart: [], subtotal: 0, platformFee: 0, cgst: 0, sgst: 0, grandTotal: 0 }),
  
  resetAll: () => set({
    currentScreen: 1,
    cart: [],
    stock: {
      mini: 40,
      medium: 40,
      bulk: 7,
    },
    paymentMethod: null,
    paymentSubOption: null,
    upiId: "",
    cardDetails: initialCardDetails,
    doorStatus: "closed",
    isAdActive: false,
    razorpayPaymentId: "",
    subtotal: 0,
    platformFee: 0,
    cgst: 0,
    sgst: 0,
    grandTotal: 0
  }),
}));
