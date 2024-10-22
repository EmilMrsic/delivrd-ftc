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
    <header className="bg-[#202125] border-b sticky top-0 z-50">
      <div className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-4 flex md:flex-row flex-col justify-between items-center">
          <div className="flex flex-col">
            {" "}
            <Image
              src="/delivrd.png"
              width={150}
              height={150}
              alt="delivrd-logo"
            />
            <span className="text-xs text-white ml-2">FTC Bids</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className=" z-50 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2"
          >
            <span className="text-xs font-medium text-center">
              We're in Beta & looking for your feedback.<br></br> Bugs or ideas?
              Text <Link href={"tel:9807587488"}>(980) 758-7488</Link>
            </span>
          </motion.div>
          <div className="flex flex-col items-end mr-2">
            <span className="bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
              {user?.brand}
            </span>
            <div className="flex items-center">
              <span className="text-white text-xs">
                {user
                  ? user.displayName + "  |" || user.email
                  : "Not logged in"}
              </span>
              <Button
                onClick={handleLogout}
                className="bg-transparent hover:bg-transparent text-xs pl-1 pr-0"
              >
                {user ? "Logout" : "Login"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
