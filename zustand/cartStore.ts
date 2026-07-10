import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  dbId:string,
  name: string;
  price: number;
  quantity:number,
  variantId?:string
  variantName?: string,
  variantPrice?: number,
  restId?:string,
  restName:string
}

interface CartStore {
  cart: CartItem[];
  addCart: (item: CartItem) => void
  deleteCart: (id: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],

      addCart: (item) =>
        set((state) => ({
          cart: [item, ...state.cart],
        })),

      deleteCart: (id) =>
        set((state) => ({
    cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    { name: "cartDetails" }
  )
);