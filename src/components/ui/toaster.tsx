"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl rounded-xl p-5 border border-emerald-400"
            key={id}
            {...props}
          >
            <div className="flex items-start gap-4 w-full h-full">
              <div className="flex flex-col flex-grow">
                {title && (
                  <ToastTitle className="text-lg font-semibold tracking-wide">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm opacity-90">
                    {description}
                  </ToastDescription>
                )}
              </div>

              {action && <div className="ml-auto">{action}</div>}

              <ToastClose className="hover:opacity-80 transition-opacity text-white/80 hover:text-white" />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
