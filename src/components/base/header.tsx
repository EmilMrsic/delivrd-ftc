import React, { FC } from "react";
import { Button } from "../ui/button";
import { IUser } from "@/types";
import { useRouter } from "next/navigation";
interface IHeaderProps {
  user: IUser | null;
}

const Header: FC<IHeaderProps> = ({ user }) => {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Delivrd FTC Bids</h1>
        <div className="flex items-center space-x-4">
          <span className="text-muted-foreground">
            {user ? user.displayName || user.email : "Not logged in"}
          </span>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            {user ? "Logout" : "Login"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
