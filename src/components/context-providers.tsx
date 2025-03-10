"use client";

import { ReduxProvider } from "@/app/redux/provider";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider>{children}</ReduxProvider>
      </QueryClientProvider>
    </>
  );
};
