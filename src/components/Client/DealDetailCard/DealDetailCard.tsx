"use client";
import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Car, DollarSign, Share2, X } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { Button } from "../../ui/button";
import { IUser, NegotiationData } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

const DealDetailCard = ({
  userData,
  negotiationData,
  setShowStickyHeader,
  responsive = false,
}: {
  userData?: IUser;
  negotiationData: NegotiationData[];
  setShowStickyHeader: (item: boolean) => void;
  responsive?: boolean;
}) => {
  const dealDetailsRef = useRef(null);
  let lastScrollY = useRef(0);
  const params = useSearchParams();
  const shared = params.get("shared");

  const shareProgress = () => {
    if (typeof window !== "undefined" && navigator) {
      window.navigator.clipboard.writeText(
        `${window.location.href}?shared=true`
      );
    }
    toast({
      title: "Link copied to clipboard",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;

        if (!entry.isIntersecting && currentScrollY > lastScrollY.current) {
          setShowStickyHeader(true);
        } else {
          setShowStickyHeader(false);
        }

        lastScrollY.current = currentScrollY;
      },
      { threshold: 0 }
    );

    if (dealDetailsRef.current) {
      observer.observe(dealDetailsRef.current);
    }

    return () => {
      if (dealDetailsRef.current) {
        observer.unobserve(dealDetailsRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`flex flex-col ${
        responsive ? "md:sticky md:flex hidden md:top-4" : "md:hidden"
      } `}
    >
      <Card className="bg-white shadow-lg mb-5">
        <CardHeader className="bg-gradient-to-r from-[#202125] to-[#0989E5] text-white">
          <CardTitle className="flex items-center">
            <Car className="mr-2" /> Deal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center space-x-2 text-[#202125]">
            <Car className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Condition:</strong> {userData?.condition}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <Car className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Vehicle of Interest:</strong> {userData?.brand}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <Car className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Model:</strong> {userData?.model[0]}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#0989E5]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Trim:</strong> {userData?.trim_and_package_options}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <Car className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Drivetrain:</strong> {userData?.drive_train}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#0989E5]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            <span>
              <strong>Trade In:</strong> {userData?.trade_details}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <DollarSign className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Finance Type:</strong> {userData?.deals[0]?.payment_type}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <DollarSign className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Budget:</strong> $
              {negotiationData[0]?.negotiations_Budget}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#202125]">
            <DollarSign className="h-5 w-5 text-[#0989E5]" />
            <span>
              <strong>Monthly Budget:</strong> $
              {negotiationData[0]?.negotiations_Payment_Budget}
            </span>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Features and Trim Details</h3>
            <p className="text-sm text-gray-600">
              {/* {dealDetails.features} */}
            </p>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4" ref={dealDetailsRef}>
            <h3 className="font-semibold text-lg">Colors</h3>
            <div className="flex items-center space-x-2 text-[#202125]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#0989E5]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Desired Exterior:</strong>{" "}
                {userData?.color_options.exterior.preferred}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#202125]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#0989E5]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Desired Interior:</strong>{" "}
                {userData?.color_options.interior.preferred}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#202125]">
              <X className="h-5 w-5 text-red-500" />
              <span>
                <strong>Exterior Deal Breakers:</strong>{" "}
                {userData?.color_options.exterior.not_preferred}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#202125]">
              <X className="h-5 w-5 text-red-500" />
              <span>
                <strong>Interior Deal Breakers:</strong>{" "}
                {userData?.color_options.interior.not_preferred}
              </span>
            </div>
          </div>
          <Separator className="my-4" />
          {!shared && (
            <Button
              onClick={shareProgress}
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Your Deal Progress
            </Button>
          )}
        </CardContent>
      </Card>
      {shared && (
        <div className="bg-white p-6 rounded-2xl shadow-md ">
          <div className="text-center space-y-4 flex flex-col items-center">
            <p className="text-lg font-semibold text-gray-800 w-[250px]">
              Discover Why Delivrd is The Ultimate Car Buying Experience
            </p>
            <Button
              onClick={() =>
                window.open(
                  "https://delivrdto.me?utm_source=shared_profile_page",
                  "_blank"
                )
              }
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600 rounded-lg py-2 shadow-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealDetailCard;
