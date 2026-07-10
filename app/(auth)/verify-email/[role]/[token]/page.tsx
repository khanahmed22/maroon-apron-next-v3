'use client'
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const { token,role } = useParams()
 
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `/api/auth/verify-email/${role}/${token}`
        );

        const data = await res.json();
        console.log(data);
        router.replace('/login')
      } catch (err) {
        console.error(err);
      }
    };

    if (token) verify();
  }, [token]);

  return <div className="flex items-center justify-center font-bold text-2xl">
    <h1>Verifying Email...</h1>
  </div>;
}