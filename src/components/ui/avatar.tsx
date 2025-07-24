import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

export default function Component() {
  return (
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@example" />
        <AvatarFallback>EX</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium leading-none">Example User</p>
        <p className="text-sm text-muted-foreground">example@example.com</p>
      </div>
    </div>
  );
}

export const UserAvatar = ({
  user,
  size,
}: {
  user: {
    name: string;
    profile_pic: string | null;
  };
  size?: "small" | "medium" | "large";
}) => {
  return (
    <Avatar
      className={
        size === "small"
          ? "h-8 w-8"
          : size === "medium"
          ? "h-10 w-10"
          : "h-12 w-12"
      }
    >
      <AvatarImage
        src={user?.profile_pic ?? "/placeholder.svg?height=40&width=40"}
        alt="@example"
      />
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
  );
};
