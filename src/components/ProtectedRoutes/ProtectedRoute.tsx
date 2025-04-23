"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    console.log("got userData:", userData);
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

    console.log({ parsed });

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
  }, [path, router]);

  return children;
};

export default ProtectedRoute;
