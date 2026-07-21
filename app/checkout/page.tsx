'use client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useCart } from "@/zustand/cartStore"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, MapPin, Store, Truck, ShoppingBag, Tag, X, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAuth } from "../AuthContext"

interface CustomerProps {
  orderNumber: string;
  custName: string;
  custEmail: string;
  custPhone: string;
  custAddress: string;
  recieveMethod: string;
  status: string;
  createdAt: Date;

  orderTotal: number;
  deliveryArea: string,
  deliveryFee: string
}

interface AreaProps {
  areaId: string;
  areaName: string;
  cityName: string;
  deliveryFee: string;
  minOrder: string;
}

interface AppliedCoupon {
  code: string;
  couponId: string;
  discount: number;
}

export default function Checkout(){
  const {cart,clearCart} = useCart()
  const router = useRouter()
  const {session} = UserAuth()

  const subtotal = cart.reduce((prev, item) => prev + item.price, 0);
  function generateOrderNumber(): number {
    return Date.now();
  }
  const ACCENT = "#D6293F"
  const INK = "#171717"
  const MUTE = "#6B7280"
  const BORDER = "#E7E5E4"
  const SOFT = "#FBF7F6"
  const SUCCESS = "#16A34A"

  const [custDetails, setCustDetails] = useState<CustomerProps>({
    orderNumber: String(generateOrderNumber()),
    custName: "",
    custEmail: session?.email ?? "",
    custPhone: "",
    custAddress: "",
    recieveMethod: "",
    status: "pending",
    createdAt: new Date(),
    deliveryArea:"",
    deliveryFee:"",
    orderTotal: 0,
  });

  
 

  
  
  const restId = cart[0]?.restId

  const fetchDeliveryZones = async (): Promise<AreaProps[]> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/area-list/${restId}/view`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch delivery zones");
    }

    return res.json();
  };

  const { data: deliveryList } = useQuery({
    queryKey: ["deliveryZone", restId],
    queryFn: fetchDeliveryZones,
    enabled: !!restId,
    staleTime: 5 * 60 * 1000,

  });

   
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    if (!trimmedCode) return;

    if (!custDetails.custEmail) {
      toast.error("Enter your email above before applying a coupon");
      return;
    }
    if (!restId || subtotal <= 0) return;

    setApplyingCoupon(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmedCode,
          cartTotal: subtotal,
          userId: custDetails.custEmail,
          restId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid coupon");
        return;
      }

      setAppliedCoupon({
        code: trimmedCode,
        couponId: data.couponId,
        discount: data.discount,
      });
      toast.success(`"${trimmedCode}" applied`);
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const selectedArea = deliveryList?.find(
    (area) => area.areaId === custDetails.deliveryArea
  );

  const deliveryFee = Number(selectedArea?.deliveryFee ?? 0);
  const minimumOrder = Number(selectedArea?.minOrder ?? 0);
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const belowMinimumOrder =
    custDetails.recieveMethod === "delivery" &&
    !!selectedArea &&
    subtotal < minimumOrder;

  const deliveryAreaMissing =
    custDetails.recieveMethod === "delivery" && !custDetails.deliveryArea;

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !custDetails.custName ||
      !custDetails.custEmail ||
      !custDetails.custPhone ||
      !custDetails.recieveMethod
    ) {
      return toast.error("Fill all fields");
    }
    if (custDetails.recieveMethod === "delivery") {
      if (!custDetails.custAddress) {
        return toast.error("Address is required for delivery");
      }
      if (!custDetails.deliveryArea) {
        return toast.error("Please select a delivery area");
      }
      if (belowMinimumOrder) {
        return toast.error(
          `Minimum order for ${selectedArea?.areaName} is Rs.${minimumOrder}`
        );
      }
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        custDetails: {
          ...custDetails,
          restId: cart[0]?.restId,
          orderTotal: finalTotal,
          restName: cart[0]?.restName,
          deliveryArea:
            custDetails.recieveMethod === "delivery"
              ? selectedArea?.areaName ?? ""
              : "",
         
          deliveryFee:
            custDetails.recieveMethod === "delivery"
              ? String(deliveryFee)
              : "",
        },
        cart,
        coupon: appliedCoupon
          ? {
              couponId: appliedCoupon.couponId,
              code: appliedCoupon.code,
              discount: appliedCoupon.discount,
            }
          : null,
      }),
    });
    clearCart();
    setAppliedCoupon(null);
    setCouponCode("");
    router.push(`/order-placed/${custDetails.orderNumber}`)
    return res.json();
  };

  const { mutate: placeOrderM } = useMutation({
    mutationKey: ["place-order"],
    mutationFn: placeOrder,
    onSuccess: () => {
      toast.success("Order Placed");
    },
  });

  return(
    <div className="min-h-screen" style={{ backgroundColor: SOFT }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-8" style={{ color: INK }}>
          Checkout
        </h1>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* ================= CART DETAILS ================= */}
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBag className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="font-bold text-lg" style={{ color: INK }}>
                Cart Details
              </h2>
            </div>

            {cart?.length > 0 ? (
              <div className="space-y-3">
                {cart?.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
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
                    </div>
                    <span className="font-semibold text-sm shrink-0" style={{ color: INK }}>
                      Rs. {c.price}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 py-10 text-center"
                style={{ color: MUTE }}
              >
                <ShoppingBag className="w-8 h-8" style={{ color: BORDER }} />
                <p className="text-sm font-medium">Nothing in cart</p>
              </div>
            )}

            {/* ================= COUPON CODE ================= */}
            {cart?.length > 0 && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: BORDER }}>
                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: INK }}>
                  <Tag className="w-4 h-4" style={{ color: MUTE }} />
                  Coupon Code
                </label>

                {appliedCoupon ? (
                  <div
                    className="flex items-center justify-between mt-1.5 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: ACCENT, backgroundColor: SOFT }}
                  >
                    <span className="text-sm font-semibold" style={{ color: ACCENT }}>
                      {appliedCoupon.code} · Rs. {appliedCoupon.discount} off
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                    >
                      <X className="w-4 h-4" style={{ color: MUTE }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE20"
                      className="rounded-xl uppercase"
                      style={{ borderColor: BORDER }}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="text-white rounded-xl shrink-0 disabled:opacity-60"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div
              className="flex items-center justify-between mt-5 pt-4 border-t text-base font-bold"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Subtotal</span>
              <span>Rs. {subtotal || 0}</span>
            </div>

            {custDetails.recieveMethod === "delivery" && selectedArea && (
              <div
                className="flex items-center justify-between mt-2 text-sm font-medium"
                style={{ color: INK }}
              >
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee}</span>
              </div>
            )}

            {appliedCoupon && (
              <div
                className="flex items-center justify-between mt-2 text-sm font-medium"
                style={{ color: SUCCESS }}
              >
                <span>Discount ({appliedCoupon.code})</span>
                <span>- Rs. {appliedCoupon.discount}</span>
              </div>
            )}

            <div
              className="flex items-center justify-between mt-2 pt-2 border-t text-lg font-bold"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Final Total</span>
              <span>Rs. {finalTotal || 0}</span>
            </div>

            {belowMinimumOrder && (
              <p className="mt-3 text-sm font-medium" style={{ color: ACCENT }}>
                Minimum order for {selectedArea?.areaName} is Rs.{minimumOrder}
              </p>
            )}
          </div>

          {/* ================= CUSTOMER DETAILS ================= */}
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: BORDER }}
          >
            <h2 className="font-bold text-lg mb-5" style={{ color: INK }}>
              Customer Details
            </h2>

            <form onSubmit={placeOrderM} className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-medium" style={{ color: INK }}>
                  Name
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: MUTE }}
                  />
                  <Input
                    type="text"
                    placeholder="Enter Name"
                    className="pl-10 rounded-xl"
                    style={{ borderColor: BORDER }}
                    value={custDetails.custName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setCustDetails({ ...custDetails, custName: e.target.value })
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-medium" style={{ color: INK }}>
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: MUTE }}
                  />
                  <Input
                    type="email"
                    disabled={session ? true:false}
                    placeholder="Enter Email"
                    className="pl-10 rounded-xl"
                    style={{ borderColor: BORDER }}
                    value={custDetails.custEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setCustDetails({ ...custDetails, custEmail: e.target.value })
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-medium" style={{ color: INK }}>
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: MUTE }}
                  />
                  <Input
                    value={custDetails.custPhone}
                    placeholder="Enter Phone"
                    className="pl-10 rounded-xl"
                    style={{ borderColor: BORDER }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setCustDetails({
                        ...custDetails,
                        custPhone: e.target.value,
                      })
                    }}
                    type="text"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-medium" style={{ color: INK }}>
                  Receive Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors"
                    style={
                      custDetails.recieveMethod === "pickup"
                        ? { backgroundColor: SOFT, borderColor: ACCENT }
                        : { borderColor: BORDER }
                    }
                  >
                    <input
                      type="radio"
                      name="receiveMethod"
                      value="pickup"
                      checked={custDetails.recieveMethod === "pickup"}
                      onChange={(e) =>
                        setCustDetails({
                          ...custDetails,
                          recieveMethod: e.target.value,
                          deliveryArea: "",
                          custAddress: "",
                        })
                      }
                      className="sr-only"
                    />
                    <Store
                      className="w-4 h-4"
                      style={{ color: custDetails.recieveMethod === "pickup" ? ACCENT : MUTE }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: custDetails.recieveMethod === "pickup" ? ACCENT : INK }}
                    >
                      Pickup
                    </span>
                  </label>

                  <label
                    className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors"
                    style={
                      custDetails.recieveMethod === "delivery"
                        ? { backgroundColor: SOFT, borderColor: ACCENT }
                        : { borderColor: BORDER }
                    }
                  >
                    <input
                      type="radio"
                      name="receiveMethod"
                      value="delivery"
                      checked={custDetails.recieveMethod === "delivery"}
                      onChange={(e) =>
                        setCustDetails({
                          ...custDetails,
                          recieveMethod: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <Truck
                      className="w-4 h-4"
                      style={{ color: custDetails.recieveMethod === "delivery" ? ACCENT : MUTE }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: custDetails.recieveMethod === "delivery" ? ACCENT : INK }}
                    >
                      Delivery
                    </span>
                  </label>
                </div>
              </div>

              {custDetails.recieveMethod === "delivery" && (
                <div>
                  <div className="flex flex-col gap-y-1.5">
                    <label className="text-sm font-medium" style={{ color: INK }}>
                      Address
                    </label>
                    <div className="relative">
                      <MapPin
                        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: MUTE }}
                      />
                      <Input
                        value={custDetails.custAddress}
                        onChange={(e) =>
                          setCustDetails({
                            ...custDetails,
                            custAddress: e.target.value,
                          })
                        }
                        type="text"
                        placeholder="e.g: C-423, Block 1, Gulshan"
                        className="pl-10 rounded-xl"
                        style={{ borderColor: BORDER }}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <label
                      className="text-sm font-semibold"
                      style={{ color: INK }}
                    >
                      Delivery Area
                    </label>

                    <Select
                      value={custDetails.deliveryArea}
                      onValueChange={(value) =>
                        setCustDetails({
                          ...custDetails,
                          deliveryArea: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl">
                        <SelectValue placeholder="Select your delivery area" />
                      </SelectTrigger>

                      <SelectContent>
                        {deliveryList?.map((area) => (
                          <SelectItem
                            key={area.areaId}
                            value={area.areaId}
                          >
                            {area.areaName} ({area.cityName}) • Rs. {area.deliveryFee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={deliveryAreaMissing || belowMinimumOrder}
                className="text-white rounded-full py-2.5 mt-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}
              >
                Place Order
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}