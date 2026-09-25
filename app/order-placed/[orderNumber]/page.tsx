'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSubdomain } from '@/app/context/SubdomainProvider'
import {
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Store,
  Banknote,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-md bg-muted animate-pulse" />
  ),
});
interface CartItem {
  id: string
  name: string
  price: number
  variantId?: string
  variantName?: string
  variantPrice?: number
}

interface OrderProps {
  id: string
  orderNumber: string
  custName: string
  custEmail: string
  custPhone: number
  custAddress: string
  orderDetails: CartItem[]
  recieveMethod: string
  status: string
  createdAt: string
  orderTotal: number,
  deliveryArea:string,
  deliveryFee: string
  isPreOrder:boolean,
  scheduledDate: string,
  scheduledWindow: string,
  paymentMethod:string
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
  deliveryWindows?: string[]
  lat:number,
  long:number
}
interface RestResponse {
  getRest: RestListProps
}

export default function OrderPlaced() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const subdomain = useSubdomain()

  const ACCENT = '#D6293F'
  const INK = '#171717'
  const MUTE = '#6B7280'
  const BORDER = '#E7E5E4'
  const SOFT = '#FBF7F6'

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

    const restAddress = restDetails?.getRest?.restAddress || ""

    const lat = restDetails?.getRest?.lat || 0.0
    const long = restDetails?.getRest?.long || 0.0

  const fetchOrder = async (): Promise<OrderProps> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-placed/${orderNumber}`
    )

    if (!res.ok) {
      throw new Error('Order not found')
    }

    return res.json()
  }

  function formatPreorderDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

  const {
    data: orderQuery,
    isPending,
    isError,
  } = useQuery<OrderProps>({
    queryKey: ['orderQueryPublic', orderNumber],
    queryFn: fetchOrder,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (isPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: SOFT }}
      >
        <p className="font-semibold" style={{ color: INK }}>
          Loading order...
        </p>
      </div>
    )
  }

  if (isError || !orderQuery) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: SOFT }}
      >
        <div
          className="bg-white border rounded-2xl p-8 text-center max-w-md w-full"
          style={{ borderColor: BORDER }}
        >
          <div className="text-5xl mb-4">😕</div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: INK }}
          >
            Order Not Found
          </h1>

          <p
            className="text-sm mb-6"
            style={{ color: MUTE }}
          >
            We could not find this order. The link may be incorrect,
            the order may not exist, or something went wrong while
            placing your order.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  const total =
    orderQuery.orderTotal ??
    orderQuery.orderDetails.reduce(
      (sum, item) => sum + (item.price ?? 0),
      0
    )

    const getStatusStyles = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return {
        bg: "#FEF3C7",
        text: "#92400E",
        label: "Pending",
      }
    case "confirmed":
      return {
        bg: "#DBEAFE",
        text: "#1D4ED8",
        label: "Confirmed",
      }
    case "delivered":
      return {
        bg: "#DCFCE7",
        text: "#166534",
        label: "Delivered",
      }
    case "cancelled":
      return {
        bg: "#FEE2E2",
        text: "#B91C1C",
        label: "Cancelled",
      }
     case "pickedup":
  return {
    bg: "#EDE9FE",
    text: "#6D28D9",
    label: "Picked Up",
  }
    default:
      return {
        bg: SOFT,
        text: MUTE,
        label: status || "Unknown",
      }
  }
}

const statusStyles = getStatusStyles(orderQuery?.status)

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: SOFT }}
    >
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: '#DCFCE7' }}
          >
            <CheckCircle2
              className="w-7 h-7"
              style={{ color: '#16A34A' }}
            />
          </div>

          <h1
            className="text-2xl font-extrabold"
            style={{ color: INK }}
          >
            Order Placed!
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: MUTE }}
          >
            Thanks - your order has been sent to the kitchen.
          </p>

          <span
            className="mt-4 text-sm font-semibold px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: SOFT,
              color: ACCENT,
            }}
          >
            Order #{orderQuery.orderNumber}
          </span>
          <div
  className="mt-3 px-4 py-2 rounded-full text-sm font-semibold"
  style={{
    backgroundColor: statusStyles.bg,
    color: statusStyles.text,
  }}
>
  Status: {statusStyles.label}
</div>
        </div>

        

        {/* Customer Details */}
        <div
          className="bg-white rounded-2xl border p-6 mb-6"
          style={{ borderColor: BORDER }}
        >
          <h2
            className="font-bold text-base mb-4"
            style={{ color: INK }}
          >
            Order Details
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <User
                className="w-4 h-4 shrink-0"
                style={{ color: ACCENT }}
              />
              <span style={{ color: INK }}>
                {orderQuery.custName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Mail
                className="w-4 h-4 shrink-0"
                style={{ color: ACCENT }}
              />
              <span style={{ color: INK }}>
                {orderQuery.custEmail}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Phone
                className="w-4 h-4 shrink-0"
                style={{ color: ACCENT }}
              />
              <span style={{ color: INK }}>
                {orderQuery.custPhone}
              </span>
            </div>

            {orderQuery.custAddress && (
              <div className="flex items-center gap-3">
                <MapPin
                  className="w-4 h-4 shrink-0"
                  style={{ color: ACCENT }}
                />
                <span style={{ color: INK }}>
                  {orderQuery.custAddress}
                </span>
              </div>
            )}

            {orderQuery.deliveryArea && (
              <div className="flex items-center gap-3">
                <MapPin
                  className="w-4 h-4 shrink-0"
                  style={{ color: ACCENT }}
                />
                <span style={{ color: INK }}>
                  {orderQuery.deliveryArea}
                </span>
              </div>
            )}

             <div className="flex items-center gap-3">
              <Banknote
                className="w-4 h-4 shrink-0"
                style={{ color: ACCENT }}
              />
              <span style={{ color: INK }}>
                {orderQuery.paymentMethod}
              </span>
            </div>

            <div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
    <Store
      className="w-4 h-4 shrink-0"
      style={{ color: ACCENT }}
    />
    <span style={{ color: INK }}>
      {orderQuery.recieveMethod}
    </span>
  </div>

  {orderQuery.isPreOrder && (
    <div className="flex flex-col border-l pl-4" style={{ borderColor: BORDER }}>
      <span className="text-sm font-medium" style={{ color: INK }}>
        {formatPreorderDate(orderQuery.scheduledDate)}
      </span>
      <span className="text-xs" style={{ color: MUTE }}>
        {orderQuery.scheduledWindow}
      </span>
    </div>
  )}
</div>
{orderQuery?.recieveMethod === "pickup" && <div className='flex gap-x-2 items-center flex-col gap-y-2'>
  <MapPin className="w-7 h-7 shrink-0"
      style={{ color: ACCENT }}/>
  <span><span className='font-bold'>Pickup Order here: </span>{restAddress}</span>{restDetails?.getRest?.lat != null &&
  restDetails?.getRest?.long != null && (
    <Map
      latitude={restDetails.getRest.lat}
      longitude={restDetails.getRest.long}
    />
)}</div>}
          </div>
        </div>


        {/* Order Summary */}
        <div
          className="bg-white rounded-2xl border p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Receipt
              className="w-5 h-5"
              style={{ color: ACCENT }}
            />
            <h2
              className="font-bold text-base"
              style={{ color: INK }}
            >
              Order Summary
            </h2>
          </div>

          <div className="space-y-3">
            {orderQuery.orderDetails.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
                style={{ borderColor: BORDER }}
              >
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: INK }}
                  >
                    {item.name}
                  </p>

                  {item.variantName && (
                    <span
                      className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: SOFT,
                        color: ACCENT,
                      }}
                    >
                      {item.variantName}
                    </span>
                  )}
                </div>

                <span
                  className="font-semibold text-sm shrink-0"
                  style={{ color: INK }}
                >
                  Rs. {item.price}
                </span>
              </div>
            ))}
          </div>

          {orderQuery?.deliveryFee && <div
            className="flex items-center justify-between mt-5 pt-4 border-t text-base font-bold"
            style={{
              borderColor: BORDER,
              color: INK,
            }}
          >
            <span>Delivery Fee: </span>
            <span>Rs. {orderQuery?.deliveryFee}</span>
          </div>}

           

          <div
            className="flex items-center justify-between mt-5 pt-4 border-t text-base font-bold"
            style={{
              borderColor: BORDER,
              color: INK,
            }}
          >
            <span>Total</span>
            <span>Rs. {total}</span>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center mt-8 text-sm font-semibold hover:underline"
          style={{ color: ACCENT }}
        >
          Back to menu
        </Link>
      </div>
    </div>
  )
}