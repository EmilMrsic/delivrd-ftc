"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/base/loader";
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
  const [signInStage, setSignInStage] = useState("Verifying");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    // Check if the current URL contains a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href) & email) {
      window.localStorage.setItem("emailForSignIn", email);
      handleSignIn();
    } else {
      setSignInStage("Failed");
    }
  }, []);

  const handleSignIn = async () => {
    try {
      // Authenticate via Firebase
      await signInWithEmailLink(auth, email, window.location.href);
      setSignInStage("Signing In");

      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Store user and email in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("emailForSignIn", userData.email);

        toast({ title: "Logged in" });

        // Redirect based on privilege
        if (userData.privilege === "Dealer") {
          router.push("/bid");
        } else if (userData.privilege === "Client") {
          router.push(`/client/${userData.id}`);
        } else if (userData.privilege === "Team") {
          router.push("/team-dashboard");
        }
      } else {
        throw new Error("User data not found");
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
      setSignInStage("Failed");
      setMessage("Failed to sign in. Please try again.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("emailForSignIn");
    const currentEmail = localStorage.getItem("currentEmail");

    if (storedUser && storedEmail === currentEmail) {
      const parsedUser = JSON.parse(storedUser);

      // Redirect based on privilege
      if (parsedUser.privilege === "Dealer") {
        router.push("/bid");
      } else if (parsedUser.privilege === "Client") {
        router.push(`/client/${parsedUser.id}`);
      } else if (parsedUser.privilege === "Team") {
        router.push("/team-dashboard");
      }
    }
  }, [router]);

  return (
    <div className="bg-[#202125] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <div className="bg-white max-w-[400px] lg:w-[400px]  flex flex-col rounded-xl p-5 gap-5">
        <h1 className="text-3xl font-bold text-center">{signInStage}</h1>
        <div clasName="bg-black">
          {signInStage !== "Failed" && <Loader size={5} />}
        </div>
      </div>
    </div>
  );
}
