"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
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
      // Authenticate via Firebase
      await signInWithEmailLink(auth, email, window.location.href);

      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail)
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
      setMessage("Failed to sign in. Please try again.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmailSubmit = (e: any) => {
    e.preventDefault();
    window.localStorage.setItem("emailForSignIn", email);
    handleSignIn();
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
    } else {
      // Validate Firebase Auth session
      const unsubscribe = getAuth().onAuthStateChanged(async (authUser) => {
        if (authUser) {
          const token = await authUser.getIdToken();
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", authUser.refreshToken);

          // Fetch user data based on email
          const q = query(
            collection(db, "users"),
            where("email", "==", authUser.email)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("emailForSignIn", authUser.email ?? "");

            // Redirect based on privilege
            if (userData.privilege === "Dealer") {
              router.push("/bid");
            } else if (userData.privilege === "Client") {
              router.push(`/client/${userData.id}`);
            } else if (userData.privilege === "Team") {
              router.push("/team-dashboard");
            }
          }
        }
      });

      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [router]);

  return (
    <div className="bg-[#202125] h-screen w-screen flex flex-col gap-4 justify-center items-center">
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
