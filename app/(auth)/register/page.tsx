'use client'
import { useState } from "react"
import { UserAuth } from "@/app/AuthContext";
import { toast } from "sonner";
import { useSubdomain } from "@/app/context/SubdomainProvider";
import { Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react"

export default function Register(){
  const [name,setName] = useState<string>("")
  const [email,setEmail] = useState<string>("")
  const [password,setPassword] = useState<string>("")
  const subdomain = useSubdomain()
  const {session} = UserAuth()
   const [showPassword, setShowPassword] = useState(false)

  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

  const registerUser =async(e:React.SubmitEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const role ='customer'

    const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    toast.error(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
    );
    return;
  }
    const res = await fetch("/api/auth/register", 
      {
        method:'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'

        },
        body: JSON.stringify({name,email,password,role,subdomain})

        
      }
    
    )
    const data = await res.json()
    console.log(data)
    toast.success('Check your Email for Verification Link')
  } 

  if(session){
    return(
      <div className="flex font-bold text-lg min-h-screen items-center justify-center"><p>You are already Signed In</p></div>
    )
  }
  return(
   <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      
 
      <form
        onSubmit={registerUser}
        className="flex flex-col gap-y-5 bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <div>
          <h1 className="font-bold text-2xl" style={{ color: INK }}>
            Create Account
          </h1>
          
        </div>

        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Name
          </label>
          <div className="relative">
            <UserRound
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type="name"
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as string]: "#F3D3D8" }}
              placeholder="John Doe"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
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
        <p className="text-xs mt-1" style={{ color: MUTE }}>
  Minimum 8 characters with uppercase, lowercase, number and special character.
</p>
 
        <button
          type="submit"
          className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }}
        >
          Sign Up
        </button>
 
        <p className="text-sm text-center" style={{ color: MUTE }}>
          Already have an account? {" "}
          <a className="font-semibold hover:underline" style={{ color: ACCENT }} href="/login">
            Log In
          </a>
        </p>
      </form>
    </div>
  )
}