"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const emailSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.toLowerCase()),
});

export default function CompleteSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if the current URL contains a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setMessage("Please provide your email to complete the sign-in");
    }
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);

      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      const q = query(
        collection(db, "Dealers"),
        where("YourEmail", "==", parsedEmail)
      );
      const querySnapshot = await getDocs(q);
      const userData = querySnapshot.docs[0].data();
      const user = {
        email: userData.YourEmail,
        phone: userData.SalesPersonPhone,
        id: userData.id,
        displayName: userData.SalesPersonName,
        brand: userData.Brand,
        lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : "",
      };
      localStorage.setItem("user", JSON.stringify(user));
      toast({
        title: "Logged in",
        //   variant: "destructive",
      });
      if (user) {
        const date = new Date();
        const dealerRef = doc(db, "Dealers", user.id);
        await updateDoc(dealerRef, {
          lastLogin: date.toISOString(),
        });
      }
      router.push("/bid"); // Redirect to the app/dashboard after successful login
    } catch (error) {
      setMessage("Failed to sign in. Please try again.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmailSubmit = (e: any) => {
    e.preventDefault();
    window.localStorage.setItem("emailForSignIn", email);
    handleSignIn();
  };

  return (
    <div className="bg-[#171717] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <div className="bg-white max-w-[400px] lg:w-[400px]  flex flex-col rounded-xl p-5 gap-5">
        <h1 className="text-3xl font-bold text-center mb-2">
          Complete Sign-In
        </h1>
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {message && <p className="text-white-500 text-sm">{message}</p>}
          <Button
            type="submit"
            className="bg-blue-500 flex gap-5 hover:bg-blue-600"
          >
            <Lock className="w-4" stroke="#2B5CAD" />
            Confirm email to authenticate
          </Button>
        </form>
      </div>
    </div>
  );
}
