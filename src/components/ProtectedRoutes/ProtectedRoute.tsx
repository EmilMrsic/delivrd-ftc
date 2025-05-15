"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(userData);
    } catch (err) {
      router.push("/");
      return;
    }

    const { privilege } = parsed;

    const isValidClientPath =
      path.includes("client") ||
      path.includes("complete-signin") ||
      path.includes("apiKey") ||
      path === "/";

    if (!isValidClientPath) {
      if (privilege === "Client") {
        router.push("/");
      }
    }

    setIsLoading(false);
  }, [path, router]);

  // if (isLoading) {
  //   return null;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
