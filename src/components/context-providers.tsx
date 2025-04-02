"use client";

import { ReduxProvider } from "@/app/redux/provider";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { getUserData } from "@/lib/user";

export const ContextProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
          },
        },
      })
  );

  //
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (path !== "/" && path !== "/complete-signin") {
      const loggedInUserData = getUserData()?.deal_coordinator_id;
      if (!loggedInUserData) {
        router.push("/");
      }
    }
  }, [path]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider>{children}</ReduxProvider>
      </QueryClientProvider>
    </>
  );
};
