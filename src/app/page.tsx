import LoginCard from "@/components/base/login-card";
import Image from "next/image";
import React from "react";

const LoginPage = () => {
  return (
    <div className="bg-[#171717] h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <Image src="/delivrd.png" width={200} height={200} alt="delivrd-logo" />
      <LoginCard />
    </div>
  );
};

export default LoginPage;
