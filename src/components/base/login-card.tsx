"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Lock } from "lucide-react";
import { z } from "zod";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { generateRandomId } from "@/lib/utils";
const emailSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.toLowerCase()),
});
const LoginCard = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const sendEmail = async (email: string) => {
    try {
      const emailData = {
        to: email,
      };
      await axios.post(`/api/email`, emailData);

      setNotification(`Email sent to ${email}`);
      setTimeout(() => setNotification(null), 6000);
    } catch (error) {
      console.error("Error sending email:", error);
      setNotification("Something went wrong");
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const sendLoginEmail = async (email: string, loginRowId: string) => {
    try {
      const emailData = {
        to: email,
        loginRowId,
      };
      await axios.post(`/api/login`, emailData);
      setNotification(`Login email sent to ${email}`);
      setTimeout(() => setNotification(null), 6000);
    } catch (error) {
      console.error("Error sending email:", error);
      setNotification("Something went wrong");
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      const loginRowId = generateRandomId();
      const loginObject = {
        id: loginRowId,
        email: parsedEmail,
        loginInitiationTimestamp: serverTimestamp(),
      };
      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        await setDoc(doc(db, "delivrd_user_logins", loginRowId), {
          ...loginObject,
          emailFound: true,
          userId: userData.id,
          userType: userData.privilege,
        });
        const user = {
          email: userData.email,
        };

        localStorage.setItem("currentEmail", user.email);

        sendLoginEmail(user.email, loginRowId);
      } else {
        await setDoc(doc(db, "delivrd_user_logins", loginRowId), {
          ...loginObject,
          emailFound: false,
        });
        await sendEmail(parsedEmail);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message);
      } else {
        console.error("Error occurred: ", err);
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="bg-white max-w-[400px] lg:w-[400px]  flex flex-col rounded-xl p-5 gap-5">
        <h1 className="text-3xl font-bold text-center mb-2">
          Putting Dreams in Driveways
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="bg-blue-500 flex gap-5 hover:bg-blue-600"
          >
            <Lock className="w-4" stroke="#2B5CAD" />
            Send Delivrd Magic Link To Your Inbox
          </Button>
        </form>
      </div>
      {notification && (
        <div className="mt-3 bg-blue-100 text-blue-900 p-3 rounded shadow-md">
          {notification}
        </div>
      )}
    </>
  );
};

export default LoginCard;
