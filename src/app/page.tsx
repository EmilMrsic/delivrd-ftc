import LoginCard from "@/components/base/login-card";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const LoginPage = () => {
  return (
    <div className="bg-[#202125] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <Image src="/delivrd.png" width={200} height={200} alt="delivrd-logo" />
      <LoginCard />
      <span className="text-sm font-medium text-center text-white">
        We're in Beta & looking for your feedback.<br></br>
        <div className="font-bold">
          Bugs or ideas? Text{" "}
          <Link href={"tel:9807587488"}>(980) 758-7488</Link>
        </div>
      </span>
    </div>
  );
};

export default LoginPage;
