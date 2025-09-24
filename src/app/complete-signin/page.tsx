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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLogin } from "@/hooks/use-login";

const emailSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.toLowerCase()),
});

export default function CompleteSignIn() {
  const [signInStage, setSignInStage] = useState("Verifying");
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email");

  const { handleSubmit, email, setEmail, error, notification } = useLogin();

  useEffect(() => {
    setEmail(emailFromParams || "");
  }, [emailFromParams]);

  return (
    <div className="bg-[#202125] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <div className="bg-white max-w-[400px] lg:w-[400px]  flex flex-col rounded-xl p-5 gap-5">
        <h1 className="text-3xl font-bold text-center">
          {signInStage === "Failed" ? "Link Expired" : signInStage}
        </h1>
        {signInStage === "Failed" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="w-fit mx-auto">{email}</p>
            <Button
              type="submit"
              className="bg-blue-500 flex gap-5 hover:bg-blue-600 w-fit mx-auto text-white text-lg"
            >
              {/* <Lock className="w-4" stroke="#2B5CAD" /> */}
              Send New Login Link
            </Button>
          </form>
        )}
        {signInStage !== "Failed" && <Loader />}
        <Suspense fallback={<Loader />}>
          <SignInContent setSignInStage={setSignInStage} />
        </Suspense>
      </div>
      {notification && (
        <div className="mt-3 bg-blue-100 text-blue-900 p-3 rounded shadow-md">
          {notification}
        </div>
      )}
      <span className="text-sm font-medium text-center text-white">
        We're in Beta & looking for your feedback.<br></br>
        <div className="font-bold">
          Bugs or ideas? Text{" "}
          <Link href={"tel:9807587488"}>(980) 758-7488</Link>
        </div>
      </span>
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
        localStorage.removeItem("user"); // Clear first

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("emailForSignIn", userData.email);
        toast({ title: "Logged in" });
        let redirectUrl = "/";
        if (userData.privilege === "Dealer") {
          redirectUrl = "/bid";
        } else if (userData.privilege === "Client") {
          redirectUrl = `/client`;
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
