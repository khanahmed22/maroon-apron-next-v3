'use client'

import { useParams,useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, ChefHat, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSubdomain } from "@/app/context/SubdomainProvider";
import { UserAuth } from "@/app/AuthContext";
export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();
  const subdomain = useSubdomain()
  const {session} = UserAuth()
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/reset-password/${token}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          router.push("/login");
          return;
        }

        setValid(true);
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      alert("Password updated successfully!");

     router.push("/login");
    } catch (err) {
      console.error(err);
      setMessage("Server error.");
    }
  };

  if (loading) {
    return <h2>Verifying reset link...</h2>;
  }

  if (!valid) {
    return <h2>Invalid or expired reset link.</h2>;
  }

  if(session){
    return(
      <div className="flex justify-center items-center min-h-screen font-bold text-2xl">
        You are already signed in
      </div>
    )
  }

  return (
     <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      
 
      <div
        className="bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <h1 className="font-bold text-2xl" style={{ color: INK }}>
          Reset Password
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: MUTE }}>
          Choose a new password for your account.
        </p>
 
        <form onSubmit={handleReset} className="flex flex-col gap-y-5">
          <div className="flex flex-col gap-y-1.5">
            <label className="text-sm font-medium" style={{ color: INK }}>
              New Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: MUTE }}
              />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 h-11 rounded-xl"
                style={{ borderColor: BORDER }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: MUTE }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
 
          {message && (
            <div
              className="flex items-start gap-2 text-sm font-medium rounded-xl px-3.5 py-3"
              style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
 
          <Button
            type="submit"
            className="h-11 rounded-xl text-white font-semibold text-base"
            style={{ backgroundColor: ACCENT }}
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}