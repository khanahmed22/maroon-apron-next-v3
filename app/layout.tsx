import type { Metadata } from "next";
import { Geist_Mono, Outfit, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

import { SubdomainProvider } from "./context/SubdomainProvider";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { AuthContextProvider } from "./AuthContext";


const interHeading = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

function resolveTenant(host: string | null): string | null {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();

  // Development
  if (hostname.endsWith(".localhost")) {
    return hostname.split(".")[0];
  }

  // Production
  if (hostname.endsWith(process.env.NEXT_PUBLIC_HOSTNAME!)) {
    return hostname.split(".")[0];
  }

  // Custom domain
  return hostname;
}

async function getRestaurant() {
  const headerList = await headers();
  const host = headerList.get("host");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant`,
      {
        headers: {
          "x-forwarded-host": host ?? "",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.restaurant;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getRestaurant();

  if (!restaurant) {
    return {
      title: "Crimson Castle",
      description: "Order online",
    };
  }

  return {
    title: restaurant.metaTitle || restaurant.restName,
    description:
      restaurant.metaDesc ||
      `Order from ${restaurant.restName} online.`,
      icons: {
    icon:  restaurant.restLogo,
    shortcut:restaurant.restLogo,
    apple:  restaurant.restLogo,
  },

    openGraph: {
      title: restaurant.metaTitle || restaurant.restName,
      description:
        restaurant.metaDesc ||
        `Order from ${restaurant.restName} online.`,
        
      images: restaurant.ogImage
        ? [restaurant.ogImage]
        : restaurant.restLogo
        ? [restaurant.restLogo]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: restaurant.metaTitle || restaurant.restName,
      description:
        restaurant.metaDesc ||
        `Order from ${restaurant.restName} online.`,
      images: restaurant.ogImage
        ? [restaurant.ogImage]
        : restaurant.restLogo
        ? [restaurant.restLogo]
        : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const subdomain = resolveTenant(headerList.get("host"));

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        outfit.variable,
        interHeading.variable
      )}
    >
      <body>
        <AuthContextProvider>
          <SubdomainProvider subdomain={subdomain}>
            <ReactQueryProvider>
              <main className="min-h-screen">{children}</main>

              <Toaster richColors position="top-center"/>
              <ReactQueryDevtools initialIsOpen={false} />
            </ReactQueryProvider>
          </SubdomainProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}