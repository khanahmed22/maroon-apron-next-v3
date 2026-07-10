'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState,useEffect } from "react"
import { Mail, ArrowLeft } from "lucide-react"
import { useSubdomain } from "@/app/context/SubdomainProvider"
import { UserAuth } from "@/app/AuthContext"
import { toast } from "sonner"
export default function ForgotPassword(){

  const [email,setEmail] = useState<string>("")
  const {session} =UserAuth()
  const [cooldown, setCooldown] = useState(0);
const subdomain = useSubdomain()
  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

useEffect(() => {
  if (cooldown <= 0) return;

  const timer = setInterval(() => {
    setCooldown((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [cooldown]);

  const sendForgotPassword=async(e:React.FormEvent<HTMLFormElement>)=>{

    e.preventDefault()
    if (cooldown > 0) return;
    const res = fetch("/api/forgot-password/customer",{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({email,subdomain})
    })
        const data = await (await res).json()

    toast.info("Email sent to your inbox");
    setCooldown(60);

    return data;
  }

  if(session){
    return(
      <div className="flex justify-center items-center min-h-screen font-bold text-2xl">
        You are already signed in
      </div>
    )
  }
  return(
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      
 
      <div
        className="bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <h1 className="font-bold text-2xl" style={{ color: INK }}>
          Forgot Password
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: MUTE }}>
          Enter your email and we'll send you a link to reset it.
        </p>
 
        <form onSubmit={sendForgotPassword} className="flex flex-col gap-y-5">
          <div className="flex flex-col gap-y-1.5">
            <label className="text-sm font-medium" style={{ color: INK }}>
              Email
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: MUTE }}
              />
              <Input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                style={{ borderColor: BORDER }}
              />
            </div>
          </div>
 
          <Button
  type="submit"
  disabled={cooldown > 0}
  className="h-11 rounded-xl text-white font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed"
  style={{ backgroundColor: ACCENT }}
>
  {cooldown > 0
    ? `Resend in ${cooldown}s`
    : "Send Email"}
</Button>
        </form>
 
        <a
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold mt-6 hover:underline"
          style={{ color: ACCENT }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Log In
        </a>
      </div>
    </div>
  )
}