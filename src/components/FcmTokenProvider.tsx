"use client";
import { db, requestForToken } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

import React, { useEffect } from "react";

const FcmTokenProvider = () => {
  const pathname = usePathname();
  useEffect(() => {
    const getToken = async () => {
      const user = JSON.parse(localStorage.getItem("user") ?? "");
      if (!user) {
        console.error("No logged-in user found in localStorage.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await requestForToken();
        console.log({ token });
        if (token) {
          const id = user.id;
          const userDocRef = doc(db, "users", id);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            await updateDoc(userDocRef, {
              fcmToken: token,
            });
            const updatedUser = { ...user, fcmToken: token };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            console.log(
              "FCM token successfully updated for the user in Firestore."
            );
          }
        }
      }
    };
    getToken();
  }, []);
  return <div></div>;
};

export default FcmTokenProvider;
