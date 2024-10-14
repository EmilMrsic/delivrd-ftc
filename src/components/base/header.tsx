import React, { FC } from "react";
import { Button } from "../ui/button";
import { IUser } from "@/types";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
      <div className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-4 flex md:flex-row flex-col justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Delivrd FTC Bids</h1>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className=" z-50 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2"
          >
            <Image src={"/bug.svg"} width={22} height={22} alt="bug" />
            <span className="text-xs font-medium">
              We're in Beta & looking for your feedback.<br></br> Bugs or ideas?
              Text <Link href={"tel:9807587488"}>(980) 758-7488</Link>
            </span>
          </motion.div>
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
      </div>
    </header>
  );
};

export default Header;
