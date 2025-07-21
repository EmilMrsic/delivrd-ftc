import React, { FC, useState } from "react";
import { Button } from "../ui/button";
import { IUser } from "@/types";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DealNegotiatorType } from "@/lib/models/team";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { Notifications } from "./notifications";
import { UserAvatar } from "../ui/avatar";
import { useIsMobile } from "@/hooks/useIsMobile";
interface IHeaderProps {
  user: IUser | null;
}

// TODO: Merge these headers into one with props for the different views

const Header: FC<IHeaderProps> = ({ user }) => {
  const [showAllBrands, setShowAllBrands] = useState(false);
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
            <span
              className="bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text cursor-pointer"
              onClick={() => setShowAllBrands(!showAllBrands)}
            >
              {Array.isArray(user?.brand)
                ? showAllBrands
                  ? user.brand.join(", ")
                  : // @ts-ignore
                    user?.brand.slice(0, 3).join(", ")
                : user?.brand}
            </span>
            <div className="flex items-center">
              <span className="text-white text-xs">
                {user ? user.name + "  |" || user.email : "Not logged in"}
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

export const TeamHeader = ({
  negotiatorData,
  clientMode = false,
  dealerMode = false,
}: {
  negotiatorData?: DealNegotiatorType;
  clientMode?: boolean;
  dealerMode?: boolean;
}) => {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const user = useLoggedInUser();
  const isMobile = useIsMobile();
  const negotiatorDataToUser = negotiatorData ? negotiatorData : user;
  const banner = (
    <div className="flex flex-col items-start">
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
        alt="DELIVRD Logo"
        className="h-8 mb-2"
      />
      <p className="text-white text-sm">Putting Dreams In Driveways</p>
    </div>
  );

  return (
    <>
      <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
        {negotiatorDataToUser?.privilege === "Team" ? (
          <Link href={"/team-dashboard"}>{banner}</Link>
        ) : (
          banner
        )}
        {dealerMode && !isMobile && (
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
        )}
        <div className="flex items-center gap-3">
          <div className="fit">
            {dealerMode && (
              <span
                className="bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text cursor-pointer"
                onClick={() => setShowAllBrands(!showAllBrands)}
              >
                {Array.isArray(user?.brand)
                  ? showAllBrands
                    ? user.brand.join(", ")
                    : // @ts-ignore
                      user?.brand.slice(0, 3).join(", ")
                  : user?.brand}
              </span>
            )}
            {!dealerMode && (
              <div className="flex items-center gap-2">
                {negotiatorDataToUser?.privilege &&
                  negotiatorDataToUser?.privilege !== "Client" && (
                    <Notifications />
                  )}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text mt-0">
                  Client Deals Dashboard
                </h1>
              </div>
            )}
            {negotiatorDataToUser && (
              <div className="flex gap-2 w-fit mr-0 ml-auto mt-2">
                <UserAvatar user={negotiatorDataToUser} size="small" />
                {!isMobile && (
                  <h1 className="text-base font-semibold text-white text-transparent bg-clip-text mt-auto mb-auto">
                    {negotiatorDataToUser?.name}
                  </h1>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {dealerMode && isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-50 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2 w-[80%] mx-auto"
        >
          <span className="text-xs font-medium text-center">
            We're in Beta & looking for your feedback.<br></br> Bugs or ideas?
            Text <Link href={"tel:9807587488"}>(980) 758-7488</Link>
          </span>
        </motion.div>
      )}
    </>
  );
};

export default Header;
