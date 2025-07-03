"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, SetStateAction, Dispatch } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { Loader } from "@/components/base/loader";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
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
  const [signInStage, setSignInStage] = useState("Verifying");
  return (
    <div className="bg-[#202125] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <div className="bg-white max-w-[400px] lg:w-[400px]  flex flex-col rounded-xl p-5 gap-5">
        <h1 className="text-3xl font-bold text-center">{signInStage}</h1>
        {signInStage !== "Failed" && <Loader />}
        <Suspense fallback={<Loader />}>
          <SignInContent setSignInStage={setSignInStage} />
        </Suspense>
      </div>
    </div>
  );
}

const SignInContent = ({
  setSignInStage,
}: {
  setSignInStage: Dispatch<SetStateAction<string>>;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const loginRowId = searchParams.get("id");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href) && email) {
      window.localStorage.setItem("emailForSignIn", email);
      handleSignIn(email, loginRowId || "");
    } else {
      setSignInStage("Failed");
    }
  }, []);

  const handleSignIn = async (email: string, loginRowId: string) => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      setSignInStage("Signing In");
      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;
      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userRef = querySnapshot.docs[0].ref;
        await updateDoc(userRef, {
          lastSignedIn: serverTimestamp(),
        });
        const userData = querySnapshot.docs[0].data();
        console.log({ userData });
        localStorage.removeItem("user"); // Clear first

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("emailForSignIn", userData.email);
        toast({ title: "Logged in" });
        console.log("got here in signup", userData);
        let redirectUrl = "/";
        if (userData.privilege === "Dealer") {
          redirectUrl = "/bid";
        } else if (userData.privilege === "Client") {
          redirectUrl = `/client/${userData.id}`;
        } else if (userData.privilege === "Team") {
          redirectUrl = "/team-dashboard";
        }

        await updateDoc(doc(db, "delivrd_user_logins", loginRowId), {
          loginCompleted: true,
          loginCompletedTimestamp: serverTimestamp(),
          redirectUrl,
        });

        router.push(redirectUrl);
      } else {
        throw new Error("User data not found");
      }
    } catch (error: any) {
      console.error("Sign-in failed:", error);
      await updateDoc(doc(db, "delivrd_user_logins", loginRowId), {
        loginCompleted: false,
        loginCompletedTimestamp: serverTimestamp(),
        loginCompletedError: error?.message || "Unknown error",
      });
      setSignInStage("Failed");
      setMessage("Failed to sign in. Please try again.");
    }
  };

  return <div>{/* rest of your code */}</div>;
};
