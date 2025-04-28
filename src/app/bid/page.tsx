"use client";
import BiddingSection from "@/components/base/bidding-section";
import { toast } from "@/hooks/use-toast";
import React, { useEffect } from "react";

const BiddingPage = () => {
  useEffect(() => {
    toast({
      title: "This is a test",
    });
    toast({
      title: "This is a test 2",
    });
    toast({
      title: "This is a test 3",
    });
  }, []);

  return <BiddingSection />;
};

export default BiddingPage;
