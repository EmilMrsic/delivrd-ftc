"use client";
import { db, requestForToken } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

import React, { useEffect } from "react";

const FcmTokenProvider = () => {
  const pathname = usePathname();
  useEffect(() => {
    const getToken = async () => {
      const strigifyUser = localStorage.getItem("user") ?? "";
      if (!strigifyUser) {
        console.error("No logged-in user found in localStorage.");
        return;
      } else {
        const user = JSON.parse(strigifyUser);
        if (!user) {
          console.error("No logged-in user found in localStorage.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await requestForToken();
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
      }
    };
    getToken();
  }, [pathname]);
  return <div></div>;
};

export default FcmTokenProvider;
