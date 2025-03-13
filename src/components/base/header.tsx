import React, { FC } from "react";
import { Button } from "../ui/button";
import { IUser, notificationType } from "@/types";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent } from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { BellIcon } from "lucide-react";
import { DealNegotiatorType } from "@/lib/models/team";
interface IHeaderProps {
  user: IUser | null;
}

// TODO: Merge these headers into one with props for the different views

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
              {Array.isArray(user?.brand) ? user.brand.join(", ") : user?.brand}
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
  handleBellClick,
  notificationCount,
  notification,
  negotiatorData,
}: {
  handleBellClick: () => void;
  notificationCount: number;
  notification: notificationType[];
  negotiatorData: DealNegotiatorType;
}) => {
  return (
    <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
      <div className="flex flex-col items-start">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
          alt="DELIVRD Logo"
          className="h-8 mb-2"
        />
        <p className="text-white text-sm">Putting Dreams In Driveways</p>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu onOpenChange={handleBellClick}>
          <DropdownMenuTrigger>
            <div className="relative">
              <BellIcon className="w-6 h-6" color="#fff" />
              {notificationCount > 0 && (
                <div className="absolute top-[-5px] right-[-5px] flex justify-center items-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                  {notificationCount}
                </div>
              )}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="z-50 ">
            <div
              className={`bg-white flex flex-col ${
                notification.length ? "max-h-[300px]" : "h-auto"
              }  overflow-y-scroll gap-3 p-2 z-10 rounded-xl`}
            >
              {notification.length ? (
                notification.map((item, index) => (
                  <Link
                    key={index}
                    target="_blank"
                    href={item.link ?? "/"}
                    className="flex flex-col gap-1 p-3 rounded-[8px] items-start hover:bg-gray-200"
                  >
                    <p className="font-bold text-lg">{item.title}</p>
                    <p className="font-normal text-gray-500 text-sm">
                      {item.body}
                    </p>
                  </Link>
                ))
              ) : (
                <p>No notifications available</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
            Client Deals Dashboard
          </h1>
          <h1 className="text-base font-semibold text-white text-transparent bg-clip-text">
            {negotiatorData?.name}
          </h1>
        </div>
      </div>
    </div>
  );
};

export const TeamDashboardViewHeader = ({
  negotiatorData,
}: {
  negotiatorData: DealNegotiatorType;
}) => {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center bg-[#202125] p-6 mb-5 shadow-lg">
      <div
        onClick={() => router.push("/team-dashboard")}
        className="flex flex-col items-start cursor-pointer"
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
          alt="DELIVRD Logo"
          className="h-8 mb-2"
        />
        <p className="text-white text-sm">Putting Dreams In Driveways</p>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
            Client Deals Dashboard
          </h1>
          <h1 className="text-base font-semibold text-white text-transparent bg-clip-text">
            {negotiatorData?.name}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Header;
