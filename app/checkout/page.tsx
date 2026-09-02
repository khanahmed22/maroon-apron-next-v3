'use client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useCart } from "@/zustand/cartStore"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, MapPin, Store, Truck, ShoppingBag, Tag, X, Loader2, Trash2,Ban} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAuth } from "../AuthContext"
import { useSubdomain } from "../context/SubdomainProvider"

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
  deliveryFee: string,
  discountAmount: string,
  isPreOrder:boolean,
  scheduledDate: string | null,
  scheduledWindow: string,

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

interface RestListProps {
  id: string
  restName: string
  subdomain: string
  restLogo: string
  restBanner: string
  restPhone: number
  restEmail: string
  restAddress: string
  restAnnouncement:string
  restInstagram: string
  restFB: string,
  restTheme:string,
  preOrdersEnabled?: boolean
  preOrderMinHours?: number
  preOrderMaxDays?: number
  pickUpWindows?: string[]
  deliveryWindows?: string[],
  orderingDisabled: boolean,
  pickupEnabled: boolean,
  deliveryEnabled:boolean
}
interface RestResponse {
  getRest: RestListProps
}

interface FixRate {
  rate: number,
  fixMode: boolean,
  FixMinOrder: number
}

// ================= PRE-ORDER TIME WINDOW HELPERS =================

function parseClockTime(raw: string): { hours: number; minutes: number } | null {
  const trimmed = raw.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (meridiem === "pm" && hours !== 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

// "7pm - 9pm" -> Date for the window's START time on the given date
function getWindowStart(dateStr: string, window: string): Date | null {
  const startRaw = window.split("-")[0];
  if (!startRaw) return null;

  const parsed = parseClockTime(startRaw);
  if (!parsed) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, parsed.hours, parsed.minutes, 0, 0);
}

// Is this window still bookable given the minimum-notice requirement?
function isWindowAvailable(
  dateStr: string | null,
  window: string,
  minHours: number
): boolean {
  if (!dateStr) return true; 
  const windowStart = getWindowStart(dateStr, window);
  if (!windowStart) return true; 

  const cutoff = new Date(Date.now() + minHours * 60 * 60 * 1000);
  return windowStart.getTime() >= cutoff.getTime();
}


export default function Checkout(){
  const {cart,clearCart,deleteCart} = useCart()
  const router = useRouter()
  const {session} = UserAuth()
  const subdomain = useSubdomain()
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
    discountAmount: "",
    isPreOrder: false,
    scheduledDate: null,
    scheduledWindow: "",
    
  });

  const fetchRestDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/restDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subdomain: subdomain }),
        })
        return res.json()
      } catch (err) {
        console.log(err)
      }
    }
  
    const { data: restDetails,isPending:detailsPending } = useQuery<RestResponse>({
      queryKey: ["restDetails", subdomain],
      queryFn: fetchRestDetails,
      enabled: !!subdomain,
      staleTime: 5 * 60 * 1000,
    })

  
 

  
  
  const restId = restDetails?.getRest?.id

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
  const fetchFixRate = async()=>{
   try{
     const fixRate = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fix-rate/${restId}/view`)
     const data = await fixRate.json()
     return data
   }
   catch(err){
     console.log(err)
   }
  }

  const {data:fixRateM} = useQuery<FixRate>({
   queryKey:['fixRate', restId],
   queryFn: fetchFixRate,
   enabled:!!restId,
   staleTime: 5 * 60 * 1000, //5min
  })
  const deliveryFee =
    custDetails.recieveMethod === "delivery"
      ? fixRateM?.fixMode
        ? Number(fixRateM?.rate ?? 0)
        : Number(selectedArea?.deliveryFee ?? 0)
      : 0;
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);
  



 
  const minimumOrder =
    custDetails.recieveMethod === "delivery"
      ? fixRateM?.fixMode
        ? Number(fixRateM?.FixMinOrder ?? 0)
        : Number(selectedArea?.minOrder ?? 0)
      : 0;

  const belowMinimumOrder =
    custDetails.recieveMethod === "delivery" &&
    !!selectedArea &&
    subtotal < minimumOrder;

  const deliveryAreaMissing =
    custDetails.recieveMethod === "delivery" && !custDetails.deliveryArea;

  const preOrdersEnabled = restDetails?.getRest?.preOrdersEnabled ?? false;
  const preOrderMinHours = restDetails?.getRest?.preOrderMinHours ?? 0;

  const availableWindows = (
    custDetails.recieveMethod === "pickup"
      ? restDetails?.getRest?.pickUpWindows
      : restDetails?.getRest?.deliveryWindows
  )?.filter((window) =>
    isWindowAvailable(custDetails.scheduledDate, window, preOrderMinHours)
  ) ?? [];

  const noSlotsForSelectedDate =
    !!custDetails.scheduledDate && availableWindows.length === 0;

  const preOrderMissing =
    preOrdersEnabled &&
    (!custDetails.scheduledDate || !custDetails.scheduledWindow);

  // Reset the picked window if it becomes invalid (date changed, or
  // time simply passed while the page was left open)
  useEffect(() => {
    if (!custDetails.scheduledDate || !custDetails.scheduledWindow) return;

    const stillValid = isWindowAvailable(
      custDetails.scheduledDate,
      custDetails.scheduledWindow,
      preOrderMinHours
    );

    if (!stillValid) {
      setCustDetails((prev) => ({ ...prev, scheduledWindow: "" }));
    }
  }, [custDetails.scheduledDate, custDetails.scheduledWindow, preOrderMinHours]);

  const placeOrder = async () => {
  if (
    !custDetails.custName ||
    !custDetails.custEmail ||
    !custDetails.custPhone ||
    !custDetails.recieveMethod
  ) {
    throw new Error("Fill all fields");
  }

  if (custDetails.recieveMethod === "delivery") {
    if (!custDetails.custAddress) {
      throw new Error("Address is required for delivery");
    }
    if (!custDetails.deliveryArea) {
      throw new Error("Please select a delivery area");
    }
    if (belowMinimumOrder) {
      throw new Error(
        fixRateM?.fixMode
          ? `Minimum order is Rs.${minimumOrder}`
          : `Minimum order for ${selectedArea?.areaName} is Rs.${minimumOrder}`
      );
    }
  }

  
  if (preOrdersEnabled) {
    if (!custDetails.scheduledDate) {
      throw new Error("Please select a date.");
    }
    if (!custDetails.scheduledWindow) {
      throw new Error("Please select a time window.");
    }
    if (
      !isWindowAvailable(custDetails.scheduledDate, custDetails.scheduledWindow, preOrderMinHours)
    ) {
      throw new Error(
        `That time slot is no longer available. Please pick another slot at least ${preOrderMinHours} hour(s) from now.`
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
        isPreOrder: preOrdersEnabled, // derived, not user-toggled
        restId: restDetails?.getRest?.id,
        orderTotal: finalTotal,
        restName: restDetails?.getRest?.restName,
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

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Could not place order");
  }

  clearCart();
  setAppliedCoupon(null);
  setCouponCode("");
  router.push(`/order-placed/${custDetails.orderNumber}`);

  return data;
};

const { mutate: placeOrderM } = useMutation({
  mutationKey: ["place-order"],
  mutationFn: placeOrder,
  onSuccess: () => {
    toast.success("Order Placed");
  },
  onError: (error: Error) => {
    toast.error(error.message || "Order could not be placed");
  },
});

  function handlePlaceOrder (e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    placeOrderM()
  }

  const preOrderMaxDays = restDetails?.getRest?.preOrderMaxDays ?? null

  const today = new Date();

const minDate = today.toISOString().split("T")[0];

const maxDate =
  preOrderMaxDays !== null &&
  preOrderMaxDays !== undefined 
  
    ? (() => {
        const date = new Date(today);
        date.setDate(date.getDate() + Number(preOrderMaxDays));
        return date.toISOString().split("T")[0];
      })()
    : undefined;

  if (restDetails?.getRest?.orderingDisabled || false) {
  const ACCENT = "#D6293F";
  const INK = "#171717";
  const MUTE = "#6B7280";
  const BORDER = "#E7E5E4";
  const SOFT = "#FBF7F6";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: SOFT }}
    >
      <div
        className="bg-white rounded-2xl border flex flex-col items-center justify-center gap-3 py-16 px-8 text-center max-w-md w-full"
        style={{ borderColor: BORDER }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#FCE8EA" }}
        >
          <Ban  className="w-7 h-7" style={{ color: ACCENT }} />
        </div>

        <h1 className="text-xl font-extrabold" style={{ color: INK }}>
          We're currently closed
        </h1>

        <p className="text-sm" style={{ color: MUTE }}>
          {restDetails?.getRest?.restName
            ? `${restDetails.getRest.restName} isn't accepting orders right now.`
            : "This restaurant isn't accepting orders right now."}
        </p>

        
      </div>
    </div>
  );
}

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
                    <Button onClick={()=>deleteCart(c.id)}><Trash2/></Button>
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

            <form onSubmit={handlePlaceOrder} className="flex flex-col gap-y-4">
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
                  {restDetails?.getRest?.pickupEnabled && <label
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
                          scheduledDate: null,
                          scheduledWindow: "",
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
                  </label>}
                  
                  {restDetails?.getRest?.deliveryEnabled && <label
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
                          scheduledDate: null,
                          scheduledWindow: "",
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
                  </label>}
                  
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
                            {area.areaName} ({area.cityName}) 
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {preOrdersEnabled &&
                (custDetails.recieveMethod === "pickup" ||
                  custDetails.recieveMethod === "delivery") && (
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: BORDER }}>
      <p className="text-sm font-semibold" style={{ color: INK }}>
        Schedule your Order
      </p>

      <Input
        type="date"
        min={minDate}
        max={maxDate}
        required
        value={custDetails.scheduledDate ?? ""}
        onChange={(e) =>
          setCustDetails({
            ...custDetails,
            scheduledDate: e.target.value,
            scheduledWindow: "", // reset window when date changes
          })
        }
      />

      {noSlotsForSelectedDate ? (
        <p className="text-sm font-medium" style={{ color: ACCENT }}>
          We can't {custDetails.recieveMethod === "pickup" ? "prepare pickup" : "deliver"} for
          this date anymore - all time slots have passed. Please choose a later date.
        </p>
      ) : (
        <Select
          value={custDetails.scheduledWindow}
          onValueChange={(value) =>
            setCustDetails({
              ...custDetails,
              scheduledWindow: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                custDetails.recieveMethod === "pickup"
                  ? "Select Pickup Window"
                  : "Select Delivery Window"
              }
            />
          </SelectTrigger>

          <SelectContent>
            {availableWindows.map((window) => (
              <SelectItem key={window} value={window}>
                {window}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )}

              <Button
                type="submit"
                disabled={deliveryAreaMissing || belowMinimumOrder || preOrderMissing}
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