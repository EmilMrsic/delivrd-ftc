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
import { useLogin } from "@/hooks/use-login";

const LoginCard = () => {
  const { toast } = useToast();
  const { handleSubmit, email, setEmail, error, notification } = useLogin();

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
