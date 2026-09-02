"use client"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "./ui/button"
import { useCart } from "@/zustand/cartStore"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingBag, Trash2 } from "lucide-react"



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

interface CartProps {
  cartOpen: boolean
  setCartOpen: Dispatch<SetStateAction<boolean>>
  activeThemeName:string,
  orderingDisabled:boolean | undefined
}

export default function Cart({ cartOpen, setCartOpen ,activeThemeName,orderingDisabled}: CartProps) {
  const { cart, clearCart, deleteCart } = useCart()
  const router = useRouter()
  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

  const subtotal = cart?.reduce((sum: number, c: CartItem) => sum + c.price, 0) ?? 0

  return (
    <Dialog open={cartOpen} onOpenChange={setCartOpen}>
      <DialogContent className="sm:max-w-md" data-theme={activeThemeName}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary"  />
            Your Cart
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {cart?.length > 0 ? (
          <>
            <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1 space-y-3">
              {cart.map((c: CartItem) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-3"
                  style={{ borderColor: BORDER }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: INK }}>
                      {c.name}
                    </p>
                    {c.variantName && (
                      <span
                        className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: SOFT, color: ACCENT }}
                      >
                        {c.variantName}
                      </span>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: MUTE }}>
                      Qty {c.quantity} · Rs. {c.price}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteCart(c.id)}
                    className="shrink-0 p-2 rounded-full hover:bg-black/5 transition-colors"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: MUTE }} />
                  </button>
                </div>
              ))}
            </div>

            <div
              className="flex items-center justify-between pt-4 mt-1 border-t text-sm font-semibold"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>

            <div className="flex gap-3 mt-2 items-center justify-center gap-x-5">
              <Button
                
                className=" rounded-full w-fit bg-red-600"
                onClick={() => clearCart()}
              >
                Clear Cart
              </Button>
              <Button
                disabled={orderingDisabled}
                className="mt-auto pt-3 w-fit text-sm font-semibold rounded-full py-2 px-4 transition-colors
                                 bg-primary text-primary-foreground
                                 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:opacity-100"
               
                onClick={() => {
                  router.push("/checkout")
                  setCartOpen(false)
                }}
              >
                Checkout
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 py-12 text-center"
            style={{ color: MUTE }}
          >
            <ShoppingBag className="w-10 h-10 text-primary"  />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm">Add something tasty to get started.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}