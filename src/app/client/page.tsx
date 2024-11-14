"use client";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import {
  Phone,
  User,
  Car,
  DollarSign,
  FileText,
  X,
  Mail,
  Share2,
} from "lucide-react";

import { DealNegotiator, IncomingBid, IUser, NegotiationData } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { formatDate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Head from "next/head";

export default function ProjectProfile() {
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const [negotiationData, setNegotiationData] = useState<NegotiationData[]>([]);

  const [dealerData, setDealerData] = useState<any>();
  const [dealNegotiatorData, setDealNegotiatorData] =
    useState<DealNegotiator>();
  const params = useSearchParams();
  const id = params.get("id");
  const [userData, setUserData] = useState<IUser>();
  const dealDetailsRef = useRef(null);
  const [clientDetails] = useState({
    phone: "(555) 123-4567",
    email: "brandon.smith@example.com",
    zip: "90210",
    city: "Los Angeles",
    state: "CA",
    dealStage: "Actively Negotiating",
    startDate: "July 1, 2023",
  });
  const [dealDetails] = useState({
    condition: "New",
    make: "Honda",
    model: "CR-V",
    trim: "EX-L",
    drivetrain: "All-Wheel Drive",
    tradeIn: "2015 Toyota Camry",
    financeType: "Lease",
    budget: "$35,000",
    monthlyBudget: "$450",
    desiredColors: {
      exterior: "Blue, White",
      interior: "Black, Beige",
    },
    dealBreakers: {
      exterior: "Red, Yellow",
      interior: "Gray",
    },
    features:
      "Leather seats, panoramic sunroof, advanced safety features including lane departure warning and adaptive cruise control. The customer is particularly interested in the fuel efficiency of the hybrid model and the spacious cargo area for family trips.",
  });

  const isVimeoLink = (url: string): boolean => {
    return url.includes("vimeo.com");
  };

  const parseComment = (comment: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return comment.split(urlRegex).map((part: string, index: number) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isYouTubeLink = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyHeader(!entry.isIntersecting);
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

  const shareProgress = () => {
    navigator.clipboard.writeText(`${window.location.href}/${userData?.id}`);
    toast({
      title: "Link copied to clipboard",

      //   variant: "destructive",
    });
  };

  const handleSetDealNegotiatorData = async (id: string) => {
    const q = query(collection(db, "team delivrd"), where("id", "==", id));
    const querySnapshot = await getDocs(q);
    const dealNegotiatorData = querySnapshot.docs[0]?.data();
    setDealNegotiatorData(dealNegotiatorData as DealNegotiator);
  };
  const fetchNegotiationsAndBids = async () => {
    if (!userData?.negotiation_id?.length) return;

    const allIncomingBids: IncomingBid[] = [];
    const negotiation: NegotiationData[] = [];

    try {
      for (const negotiationId of userData.negotiation_id) {
        const negotiationRef = doc(db, "negotiations", negotiationId);
        const negotiationSnap = await getDoc(negotiationRef);

        if (negotiationSnap.exists()) {
          const negotiationData = negotiationSnap.data() as any;
          const incomingBidsArray = negotiationData.incoming_bids;
          negotiation.push(negotiationData);

          if (
            Array.isArray(incomingBidsArray) &&
            incomingBidsArray.length > 0
          ) {
            const incomingBidsQuery = query(
              collection(db, "Incoming Bids"),
              where("bid_id", "in", incomingBidsArray)
            );

            const querySnapshot = await getDocs(incomingBidsQuery);
            querySnapshot.forEach((doc) => {
              allIncomingBids.push(doc.data() as IncomingBid);
            });
          }
        }
      }

      setIncomingBids(allIncomingBids);
      setNegotiationData(negotiation);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (!id) {
      const user = localStorage.getItem("user");
      setUserData(JSON.parse(user ?? ""));
    } else {
      const fetchUserData = async () => {
        const q = query(collection(db, "users"), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs[0]?.data();
        console.log(userData);
        setUserData(userData as IUser);
      };
      fetchUserData();
    }
  }, [params]);

  useEffect(() => {
    handleSetDealNegotiatorData(userData?.deal_negotiator[0] ?? "");
  }, [userData]);

  useEffect(() => {
    fetchNegotiationsAndBids();
  }, [dealNegotiatorData]);

  useEffect(() => {
    const fetchDealersData = async (incomingBid: IncomingBid[]) => {
      try {
        const dealerPromises = incomingBid.map(async (bid) => {
          const q = query(
            collection(db, "Dealers"),
            where("id", "==", bid.dealerId)
          );
          const querySnapshot = await getDocs(q);
          const dealerInfo = querySnapshot.docs[0]?.data();
          return dealerInfo;
        });

        const allDealersData = await Promise.all(dealerPromises);
        setDealerData(allDealersData as any);
      } catch (error) {
        console.error("Error fetching dealer data:", error);
      }
    };

    fetchDealersData(incomingBids);
  }, [incomingBids]);

  return (
    <>
      <Head>
        <meta property="og:title" content={userData?.name} />
        <meta property="og:description" content="Active vehicle negotiation" />
        <meta
          property="og:image"
          content="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
        />
      </Head>
      <div className=" justify-items-center	 mx-auto p-4 space-y-6 bg-[#E4E5E9] min-h-screen">
        <div className="flex container justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
          <div className="flex flex-col items-start">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
              alt="DELIVRD Logo"
              className="h-8 mb-2"
            />
            <p className="text-white text-sm">Putting Dreams In Driveways</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
              {userData?.name}
            </h1>
          </div>
        </div>

        {showStickyHeader && (
          <div className="md:hidden sticky top-0 z-10 bg-gradient-to-r from-[#202125] to-[#0989E5] text-white p-4 rounded-lg shadow-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center">
                <Car className="mr-2 h-4 w-4" />
                {userData?.brand} {userData?.model[0]}
              </span>
              <span>
                <DollarSign className="inline mr-1 h-4 w-4" />
                {negotiationData[0]?.negotiations_Budget}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline mr-1 h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {userData?.color_options.exterior.preferred}
              </span>
              <span>
                <DollarSign className="inline mr-1 h-4 w-4" />
                {negotiationData[0]?.negotiations_Payment_Budget}/mo
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline mr-1 h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
                Trade In: {userData?.trade_details}
              </span>
              <span>
                <DollarSign className="inline mr-1 h-4 w-4" />
                {userData?.deals[0].payment_type}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>
                <Car className="inline mr-1 h-4 w-4" />
                Drivetrain: {userData?.drive_train}
              </span>
            </div>
          </div>
        )}

        <div className="grid container grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="md:hidden">
              <Card className="bg-white shadow-lg" ref={dealDetailsRef}>
                <CardHeader className="bg-gradient-to-r from-[#202125] to-[#0989E5] text-white p-4">
                  <CardTitle className="flex items-center text-lg">
                    <Car className="mr-2" /> Deal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {Object.entries(dealDetails).map(([key, value]) => {
                    if (typeof value === "string" && key !== "features") {
                      return (
                        <div
                          key={key}
                          className="flex items-center space-x-2 text-[#202125]"
                        >
                          {key === "condition" ||
                          key === "make" ||
                          key === "model" ? (
                            <Car className="h-5 w-5 text-[#0989E5]" />
                          ) : key === "trim" ? (
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
                          ) : key === "tradeIn" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-[#0989E5]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                            </svg>
                          ) : (
                            <DollarSign className="h-5 w-5 text-[#0989E5]" />
                          )}
                          <span className="flex-grow">
                            <strong>
                              {key.charAt(0).toUpperCase() + key.slice(1)}:
                            </strong>{" "}
                            {value}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      Features and Trim Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      {/* {userData?.trim_and_package_options} */}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
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
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-lg !mt-0">
              <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
                <CardTitle className="flex items-center">
                  <User className="mr-2" /> Client Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex  items-center space-x-2 text-[#202125]">
                      <Phone className="h-5 w-5 text-[#0989E5]" />
                      <span>Phone: {userData?.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#202125]">
                      <Mail className="h-5 w-5 text-[#0989E5]" />
                      <span>Email: {userData?.email}</span>
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
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Zip: {userData?.deals[0].zip_code}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#202125]">
                      <FileText className="h-5 w-5 text-[#0989E5]" />
                      <span>Deal Stage: {clientDetails.dealStage}</span>
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
                          d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>City: {userData?.city}</span>
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
                          d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>State: {userData?.state}</span>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center space-x-4 mt-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={
                        (dealNegotiatorData?.profile_pic &&
                          dealNegotiatorData?.profile_pic) ??
                        `/placeholder.svg?height=60&width=60`
                      }
                      alt="Staff"
                    />
                    <AvatarFallback>TO</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg text-[#202125]">
                      {dealNegotiatorData?.name ?? ""}
                    </div>
                    <div className="text-[#202125]">
                      {dealNegotiatorData?.role ?? ""}
                    </div>
                    <div className="mt-1 text-sm text-[#202125]">
                      <p>Contact Delivrd (text messages preferred)</p>
                      <p className="font-semibold">(386) 270-3530</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-auto">
                    <>
                      {dealNegotiatorData?.video_link && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative w-full h-[400px]">
                              {isVimeoLink(
                                dealNegotiatorData?.video_link ?? ""
                              ) ? (
                                <iframe
                                  src={`https://player.vimeo.com/video/${
                                    dealNegotiatorData?.video_link.split("/")[3]
                                  }`}
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  allow="autoplay; fullscreen"
                                />
                              ) : isYouTubeLink(
                                  dealNegotiatorData?.video_link
                                ) ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${
                                    dealNegotiatorData?.video_link
                                      .split("v=")[1]
                                      ?.split("&")[0]
                                  }`}
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  allow="autoplay; fullscreen"
                                />
                              ) : (
                                <p>Video not available</p>
                              )}
                            </div>
                          </DialogTrigger>
                        </Dialog>
                      )}
                    </>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
                <CardTitle className="flex items-center">
                  <FileText className="mr-2" /> Incoming Bids
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {incomingBids.map((item, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-l-blue-500 pl-4 pb-6"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-[#202125]">
                          {dealerData
                            ? dealerData[index]?.Dealership ?? ""
                            : ""}
                        </h3>
                      </div>
                      <time className="block mb-2 text-sm text-[#202125]">
                        {formatDate(item?.timestamp)}
                      </time>
                      <p className="text-[#202125] mb-4 text-sm">
                        Price: $
                        {item?.comments.length
                          ? item?.price
                          : "No price available"}
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="flex space-x-2 mb-4">
                            <Button key={index} variant="outline" size="sm">
                              View Offer
                            </Button>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="p-6 bg-white rounded-md shadow-lg max-w-2xl w-full">
                          <div className="text-[#202125] space-y-4">
                            <p className="text-2xl font-bold">
                              {dealerData
                                ? dealerData[index]?.Dealership ?? ""
                                : ""}{" "}
                              Detail
                            </p>

                            <div className="flex space-x-4">
                              {item.files.map((file, index) => {
                                const isImage = [
                                  "jpg",
                                  "jpeg",
                                  "png",
                                  "gif",
                                  "bmp",
                                  "webp",
                                ].some((ext) =>
                                  file.toLowerCase().includes(ext)
                                );
                                return (
                                  <div
                                    key={index}
                                    onClick={() => window.open(file, "_blank")}
                                    className="bg-transparent cursor-pointer w-20 h-20 flex items-center justify-center rounded-md relative overflow-hidden"
                                  >
                                    {isImage ? (
                                      <img
                                        src={file}
                                        alt="Uploaded file"
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <embed
                                        type="application/pdf"
                                        width="100%"
                                        height="100%"
                                        src={file}
                                        style={{ zIndex: -1 }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-1">
                              <p className="font-semibold text-lg">
                                {dealerData[index]?.SalesPersonName}
                              </p>
                              <p>
                                {dealerData[index]?.City},{" "}
                                {dealerData[index]?.State}
                              </p>
                              <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                                {item?.inventoryStatus}
                              </span>
                            </div>

                            <div className="flex justify-between mt-4 border-t pt-4">
                              <div>
                                <p className="text-gray-500">Date Submitted</p>
                                <p>{formatDate(item.timestamp)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Price</p>
                                <p className="text-2xl font-semibold">
                                  ${item.price}
                                </p>
                                <p className="text-gray-500">
                                  Total Discount: ${item.discountPrice}
                                </p>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-semibold mb-2">
                                Additional Comments
                              </p>
                              <p>{parseComment(item.comments)}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <div className="md:sticky md:top-4">
              <Card className="bg-white shadow-lg">
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
                      <strong>Trim:</strong>{" "}
                      {userData?.trim_and_package_options}
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
                      <strong>Finance Type:</strong>{" "}
                      {userData?.deals[0]?.payment_type}
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
                    <h3 className="font-semibold text-lg">
                      Features and Trim Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      {/* {dealDetails.features} */}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
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
                  <Button
                    onClick={shareProgress}
                    className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Your Deal Progress
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
