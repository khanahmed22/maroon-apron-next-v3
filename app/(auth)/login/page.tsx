'use client'
import { useState } from "react"
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner";

export default function Login(){
  const {session,checkAuth} = UserAuth()
  const [email,setEmail] = useState<string>("")
  const [password,setPassword] = useState<string>("")
  const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)

  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

  const loginUser =async(e:React.SubmitEvent<HTMLFormElement>)=>{
    e.preventDefault()
    try{
      const res = await fetch("/api/auth/login", 
      {
        method:'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'

        },
        body: JSON.stringify({email,password})

        
      }
    
    )
    const data = await res.json()
    console.log(data)
    await checkAuth()
    router.push('/account')
  } 
    
    catch(err){
      console.log(err)
      toast.error('Invalid Email or address')
      
    }
    
  }

 
  if(session){
    return(
      <div className="flex font-bold flex-col gap-y-4 text-lg min-h-screen items-center justify-center"><p>You are already Signed In</p>
      <button  className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }} onClick={()=>router.push('/account')}>Go to Dashboard</button></div>
    )
  }
  return(
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      
 
      <form
        onSubmit={loginUser}
        className="flex flex-col gap-y-5 bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <div>
          <h1 className="font-bold text-2xl" style={{ color: INK }}>
            Welcome back
          </h1>
          
        </div>
 
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type="email"
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as string]: "#F3D3D8" }}
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>
        </div>
 
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as string]: "#F3D3D8" }}
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
 
        <button
          type="submit"
          className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }}
        >
          Log In
        </button>
 
        <p className="text-sm text-center" style={{ color: MUTE }}>
          Don&apos;t have an account?{" "}
          <a className="font-semibold hover:underline" style={{ color: ACCENT }} href="/register">
            Sign up
          </a>
        </p>

        <p className="text-sm text-center" style={{ color: MUTE }}>
          
          <a className="font-semibold hover:underline" style={{ color: ACCENT }} href="/forgot-password">
            Forgot Password ?
          </a>
        </p>
      </form>
    </div>
  )
}