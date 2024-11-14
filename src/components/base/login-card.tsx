"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Lock } from "lucide-react";
import { z } from "zod";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const sendEmail = async (email: string) => {
    try {
      const emailData = {
        to: email,
      };
      await axios.post(`/api/email`, emailData);
      toast({
        title: `Email sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const sendLoginEmail = async (email: string) => {
    try {
      const emailData = {
        to: email,
      };
      await axios.post(`/api/login`, emailData);
      toast({
        title: `Login email sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      console.log(email);

      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const user = {
          email: userData.email,
          // phone: userData.SalesPersonPhone,
          // id: userData.id,
          // displayName: userData.SalesPersonName,
          // brand: userData.Brand,
        };

        sendLoginEmail(user.email);
      } else {
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
  );
};

export default LoginCard;
