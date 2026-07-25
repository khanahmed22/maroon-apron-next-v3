"use client"

import { useSubdomain } from "./context/SubdomainProvider"
import { useQuery } from "@tanstack/react-query"
import { useCart } from "../zustand/cartStore"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import Cart from "@/components/Cart"
import { resolveThemeName } from "@/lib/themes"
import Image from "next/image"
import {
  ShoppingBag,
  Search,
  SearchX,
  Plus,
  Minus,
  MapPin,
  Phone,
  
  Loader2,
  UtensilsCrossed,
  LayoutGrid,
} from "lucide-react"
import { UserAuth } from "./AuthContext"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ACCENT = "#D6293F"
const MUTE = "#6B7280"

interface VariantProps {
  id: string
  variantName: string
  variantPrice: number
}

interface InventProps {
  id: string
  name: string
  price: number
  variants: VariantProps[]
  imageUrl: string
  restId: string
  restName: string
  category: string,
  stockAmount: number,
  description:string,
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
  restTheme:string
}
interface RestResponse {
  getRest: RestListProps
}


interface Selection {
  variantId?: string
  quantity: number
}
interface CartItem {
  id: string;
  dbId:string,
  name: string;
  price: number;
  quantity:number,

  variantId?:string,
  variantName?: string,
  variantPrice?: number,
  restId?:string,
  restName:string
}

export default function Home() {
  const subdomain = useSubdomain()
  const [cartOpen, setCartOpen] = useState(false)
  const { session } = UserAuth()
  const router = useRouter()
  const { addCart, cart } = useCart()
  const [categoryTab, setCategoryTab] = useState("all")
  const [search, setSearch] = useState("")
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [activeItem, setActiveItem] = useState<InventProps | null>(null)

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/${subdomain}`)
      const result = await response.json()

      return result?.data
    } catch (err) {
      console.log(err)
    }
  }

  const { data: restQuery = [], isPending:menuPending } = useQuery<InventProps[]>({
    queryKey: ["restquery"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  })

  function generateUUID(): string {
    return uuidv4()
  }

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

  const getSelection = (itemId: string): Selection =>
    selections[itemId] ?? { variantId: undefined, quantity: 1 }

  const setItemVariant = (itemId: string, variantId: string) =>
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...getSelection(itemId), variantId },
    }))

  const setItemQuantity = (itemId: string, quantity: number) => {
  const item = restQuery.find((i) => i.id === itemId);

  if (!item) return;

  const maxStock = item.stockAmount;

  setSelections((prev) => ({
    ...prev,
    [itemId]: {
      ...getSelection(itemId),
      quantity: Math.min(Math.max(1, quantity), maxStock),
    },
  }));
};

  const filterCategory = restQuery?.filter((item) => {
    const matchCategory = categoryTab === "all" || item.category === categoryTab
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const categories = ["all", ...new Set(restQuery.map((item) => item.category))]

  const cartCount = cart?.reduce((sum: number, c: CartItem) => sum + c.quantity, 0) ?? 0

  const confirmAddToCart = () => {
  if (!activeItem) return;

  const selection = getSelection(activeItem.id);

  if (
    activeItem.variants?.length > 0 &&
    !selection.variantId
  ) {
    return;
  }

  const selectedVariant = activeItem.variants?.find(
    (v) => v.id === selection.variantId
  );

  const unitPrice =
    selectedVariant?.variantPrice ?? activeItem.price;

  addCart({
    id: generateUUID(),
    dbId: activeItem.id,
    name: activeItem.name,
    restId: activeItem.restId,
    restName: activeItem.restName,
    price: unitPrice * selection.quantity,
    quantity: selection.quantity,
    variantId: selectedVariant?.id,
    variantName: selectedVariant?.variantName,
    variantPrice: selectedVariant?.variantPrice,
  });

  setItemQuantity(activeItem.id, 1);
  setActiveItem(null);
};


  const activeSelection = activeItem ? getSelection(activeItem.id) : null
  const activeVariant = activeItem?.variants?.find((v) => v.id === activeSelection?.variantId)
  const activeUnitPrice = activeVariant?.variantPrice ?? activeItem?.price ?? 0

 const variantRequired =
  (activeItem?.variants?.length ?? 0) > 0 &&
  !activeSelection?.variantId;

  const activeThemeName = resolveThemeName(restDetails?.getRest?.restTheme)

  




  if (menuPending || detailsPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading the menu…</p>
      </div>
    )
  }

  if (restDetails?.getRest?.subdomain !== subdomain) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Restaurant Not Found
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          We couldn't find a restaurant at this address. The link may be
          incorrect, or the restaurant may no longer be available.
        </p>
      </div>
    </div>
  );
}
  

  return (
     <div
      data-theme={activeThemeName}
      className="min-h-screen w-full bg-background text-foreground"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
     
        {restDetails?.getRest?.restAnnouncement && <div className="bg-accent-foreground text text-accent font-bold flex items-center justify-center h-10 w-full">
          <h1>{restDetails?.getRest?.restAnnouncement || ""}</h1>
        </div> }
     
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
        <div className="flex items-center gap-2.5 min-w-0">
          <Image
            width={200}
            height={200}
            loading="eager"
            className="w-9 h-9 rounded-full object-cover border border-border"
            src={restDetails?.getRest?.restLogo || "https://placehold.co/200x200"}
            alt={restDetails?.getRest?.restName || "Restaurant logo"}
          />
          <span className="font-bold text-base sm:text-lg truncate">
            {restDetails?.getRest?.restName || ""}
          </span>
        </div>
 
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setCartOpen(true)}
            className="relative rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center bg-foreground text-background">
                {cartCount}
              </span>
            )}
          </Button>
          {session ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/account")}
            >
              Account
            </Button>
          ) : (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/login")}
            >
              Log In
            </Button>
          )}
        </div>
 
        <Cart cartOpen={cartOpen} setCartOpen={setCartOpen} activeThemeName={activeThemeName} />
      </nav>
 
      <main className="pb-24">
        {/* ================= BANNER ================= */}
        <div className="relative">
          <Image
            width={1200}
            height={400}
            loading="eager"
            className="w-full h-40 sm:h-56 md:h-64 object-cover"
            src={restDetails?.getRest?.restBanner || "https://placehold.co/1200x400"}
            alt={`${restDetails?.getRest?.restName || "Restaurant"} banner`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex items-end justify-between gap-3">
            <h1 className="text-white text-2xl sm:text-4xl font-extrabold drop-shadow-sm">
              {restDetails?.getRest?.restName || "Welcome!"}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Order online
            </span>
          </div>
        </div>
 
        {/* ================= SEARCH + CATEGORIES ================= */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-border px-4 sm:px-6 py-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the menu…"
              className="pl-10 rounded-full h-11 border-border"
            />
          </div>
 
          <Tabs value={categoryTab} onValueChange={setCategoryTab}>
            <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap justify-start">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors flex items-center gap-1.5
                             border-border text-muted-foreground
                             data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-primary-foreground"
                >
                  {category === "all" && <LayoutGrid className="w-3.5 h-3.5" />}
                  {category === "all" ? "All" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
 
        {/* ================= MENU GRID ================= */}
        <div className="px-4 sm:px-6 pt-6">
          {filterCategory.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filterCategory.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl border border-border bg-card overflow-hidden flex flex-col transition-all ${
                    m.stockAmount === 0 ? "opacity-50 grayscale" : "hover:shadow-lg"
                  }`}
                >
                  {m.stockAmount === 0 && (
                    <span className="mt-2 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Out of Stock
                    </span>
                  )}
                  <Image
                    width={400}
                    height={300}
                    src={m.imageUrl || restDetails?.getRest?.restLogo || "https://placehold.co/400x300"}
                    alt={m.name}
                    className="w-full h-40 object-cover"
                  />
 
                  <div className="p-4 flex flex-col flex-1 gap-y-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base leading-snug">{m.name}</h3>
                      
                    </div>
 
                    {m.variants?.length > 0 && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {m.variants.length} option{m.variants.length > 1 ? "s" : ""} available
                      </p>
                    )}
                    <button
                      onClick={() => setActiveItem(m)}
                      disabled={m.stockAmount === 0}
                      className="mt-auto pt-3 w-full text-sm font-semibold rounded-full py-2 px-4 transition-colors
                                 bg-primary text-primary-foreground
                                 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:opacity-100"
                    >
                      {m.stockAmount === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-2 py-20 text-muted-foreground">
              <SearchX className="w-10 h-10 text-border" />
              <p className="font-medium">Nothing matches that search.</p>
              <p className="text-sm">Try a different dish or category.</p>
            </div>
          )}
        </div>
      </main>
 
      {/* ================= PRODUCT DETAIL MODAL ================= */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="sm:max-w-md" data-theme={activeThemeName}>
          {activeItem && (
            <>
              <DialogHeader>
                <DialogTitle>{activeItem.name}</DialogTitle>
                <DialogDescription>{activeItem.description}</DialogDescription>
              </DialogHeader>
 
              <Image
                width={400}
                height={300}
                src={activeItem.imageUrl || "https://placehold.co/400x300"}
                alt={activeItem.name}
                className="w-full h-44 object-cover rounded-xl"
              />
 
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-bold text-lg text-primary">
                  Rs. {activeUnitPrice}
                </span>
              </div>
 
              {activeItem.variants?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2 text-foreground">
                    Choose an option
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeItem.variants.map((v) => {
                      const active = activeSelection?.variantId === v.id
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setItemVariant(activeItem.id, v.id)}
                          className={`text-sm font-medium px-3.5 py-2 rounded-full border transition-colors ${
                            active
                              ? "bg-accent border-primary text-accent-foreground"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {v.variantName} · Rs. {v.variantPrice}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
 
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4 rounded-full border border-border px-2 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setItemQuantity(activeItem.id, (activeSelection?.quantity ?? 1) - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-semibold w-5 text-center">
                    {activeSelection?.quantity ?? 1}
                  </span>
                  <button
                    type="button"
                    disabled={(activeSelection?.quantity ?? 1) >= activeItem.stockAmount}
                    onClick={() =>
                      setItemQuantity(activeItem.id, (activeSelection?.quantity ?? 1) + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
 
                <button
                  onClick={confirmAddToCart}
                  disabled={variantRequired}
                  className="flex-1 ml-4 text-sm font-semibold rounded-full py-2.5 px-4 transition-opacity
                             bg-primary text-primary-foreground
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {variantRequired
                    ? "Select an option"
                    : `Add to Cart · Rs. ${activeUnitPrice * (activeSelection?.quantity ?? 1)}`}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
 
      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 text-sm text-muted-foreground">
          {restDetails?.getRest?.restPhone && (
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              {restDetails.getRest.restPhone}
            </span>
          )}
          {restDetails?.getRest?.restAddress && (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {restDetails.getRest.restAddress}
            </span>
          )}
          {restDetails?.getRest?.restInstagram && (
            <span className="flex items-center gap-2">{restDetails.getRest.restInstagram}</span>
          )}
          {restDetails?.getRest?.restFB && (
            <span className="flex items-center gap-2">{restDetails.getRest.restFB}</span>
          )}
        </div>
      </footer>
    </div>
  )
}