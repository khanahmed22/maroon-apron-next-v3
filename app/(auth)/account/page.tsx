'use client'
import { UserAuth } from "@/app/AuthContext"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useSubdomain } from "@/app/context/SubdomainProvider"
import { LogOut, Receipt, User } from "lucide-react"

interface CartItem {
  id: string;
  name: string;
  price: number;
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
}
interface OrderProps{
  id: string ,
  orderNumber: string,
  custName :string,
  custEmail: string,
  custPhone: number,
  custAddress :string,
  orderDetails: CartItem[],
  recieveMethod :string,
  status: string,
  createdAt: string,
  orderTotal:number
  
}
export default function Account(){
  const {session,checkAuth} = UserAuth()
  const router = useRouter()
  const subdomain = useSubdomain()
  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

  const fetchOrderBySubdomain = async () => {
  const res = await fetch(`/api/${subdomain}/my-orders`, {
   
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    
  });
 
  return res.json();
};

  const {data:orderUserQuery =[]} =useQuery<OrderProps[]>({
    queryKey:['orderQueryuser'],
    queryFn:fetchOrderBySubdomain,
    enabled:!!session,
        staleTime: 5 * 60 * 1000,

  })

  const fetchLogout = async() =>{
    try{
      const res = await fetch("/api/auth/logout",{
        method: 'POST',
        credentials: 'include',
        headers:{
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      console.log(data)
      await checkAuth()
      router.push('/login')
    }
    catch(err){
      console.log(err)
    }
  }
  if(!session){
    return(
      <div>
        <h1>Login to your account</h1>
        <Button onClick={()=>router.push('/login')}>Login</Button>
      </div>
    )
  }

  
  return(
    <div className="min-h-screen" style={{ backgroundColor: SOFT }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* ================= HEADER ================= */}
        <div
          className="bg-white rounded-2xl border p-6 flex items-center justify-between gap-4 mb-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: SOFT, color: ACCENT }}
            >
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: MUTE }}>
                Welcome back
              </p>
              <p className="font-bold text-lg truncate" style={{ color: INK }}>
                {session?.name}
              </p>
            </div>
          </div>
 
          <Button
            variant="outline"
            onClick={() => fetchLogout()}
            className="rounded-full gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
 
        {/* ================= ORDERS ================= */}
        <div
          className="bg-white rounded-2xl border p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Receipt className="w-5 h-5" style={{ color: ACCENT }} />
            <h2 className="font-bold text-lg" style={{ color: INK }}>
              Your Orders
            </h2>
          </div>
 
          {orderUserQuery?.length > 0 ? (
            <div className="space-y-3">
              {orderUserQuery?.map((o) => (
                <div
                  key={o?.orderNumber}
                  className="flex items-center justify-between gap-3 rounded-xl border p-4"
                  style={{ borderColor: BORDER }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: INK }}>
                      Order #{o?.orderNumber}
                    </p>
                    <p className="text-sm mt-0.5 truncate" style={{ color: MUTE }}>
                      {o?.custName}
                    </p>
                  </div>
                  <span className="font-bold text-sm shrink-0" style={{ color: ACCENT }}>
                    Rs. {o?.orderTotal}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 py-12 text-center"
              style={{ color: MUTE }}
            >
              <Receipt className="w-9 h-9" style={{ color: BORDER }} />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-sm">Place one to see it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}