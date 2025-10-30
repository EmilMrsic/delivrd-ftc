"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import FcmTokenProvider from "../FcmTokenProvider";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [useFcm, setUseFcm] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    let parsed;
    if (!userData && !path.includes("/dealer/trade") && path !== "/") {
      router.push("/");

      try {
        parsed = JSON.parse(userData as string);
      } catch (err) {
        router.push("/");
        return;
      }
      return;
    }

    if (userData && parsed) {
      const { privilege } = parsed;
      const isValidClientPath =
        path.includes("client") ||
        path.includes("complete-signin") ||
        path.includes("apiKey") ||
        path.includes("/dealer/trade") ||
        path === "/";
      if (!isValidClientPath) {
        if (privilege === "Client") {
          router.push("/");
        }
      } else {
        setUseFcm(true);
      }
    }

    setIsLoading(false);
  }, [path, router]);

  // if (isLoading) {
  //   return null;
  // }

  return (
    <>
      {useFcm && <FcmTokenProvider />}
      {children}
    </>
  );
};

export default ProtectedRoute;
