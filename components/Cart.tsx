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

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

interface CartProps {
  cartOpen: boolean
  setCartOpen: Dispatch<SetStateAction<boolean>>
}

export default function Cart({ cartOpen, setCartOpen }: CartProps) {
  const { cart, clearCart, deleteCart } = useCart()
  const router = useRouter()

  const subtotal = cart?.reduce((sum: number, c: any) => sum + c.price, 0) ?? 0

  return (
    <Dialog open={cartOpen} onOpenChange={setCartOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: ACCENT }} />
            Your Cart
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {cart?.length > 0 ? (
          <>
            <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1 space-y-3">
              {cart.map((c: any) => (
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

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => clearCart()}
              >
                Clear Cart
              </Button>
              <Button
                className="flex-1 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}
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
            <ShoppingBag className="w-10 h-10" style={{ color: BORDER }} />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm">Add something tasty to get started.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}