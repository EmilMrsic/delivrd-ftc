"use client";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DealerData,
  DealNegotiator,
  IncomingBid,
  IUser,
  NegotiationData,
} from "@/types";
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
import { usePathname } from "next/navigation";
import DealDetailCard from "@/components/Client/DealDetailCard";
import ClientOverviewCard from "@/components/Client/ClientOverviewCard";
import IncomingBidsCard from "@/components/Client/IncomingBidsCard/IncomingBidsCard";
import ClientStickyHeader from "@/components/Client/ClientStickyHeader";
import { Loader } from "@/components/base/loader";

function ProjectProfile() {
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const [negotiationData, setNegotiationData] = useState<NegotiationData[]>([]);

  const [dealerData, setDealerData] = useState<DealerData[]>([]);
  const [dealNegotiatorData, setDealNegotiatorData] =
    useState<DealNegotiator>();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const [userData, setUserData] = useState<IUser>();

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
        setUserData(userData as IUser);
      };
      fetchUserData();
    }
  }, [pathname]);

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
        setDealerData(allDealersData as DealerData[]);
      } catch (error) {
        console.error("Error fetching dealer data:", error);
      }
    };

    fetchDealersData(incomingBids);
  }, [incomingBids]);

  return userData &&
    incomingBids &&
    dealNegotiatorData &&
    dealerData &&
    negotiationData ? (
    <>
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
          <ClientStickyHeader
            userData={userData}
            negotiationData={negotiationData}
          />
        )}

        <div className="grid container grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <DealDetailCard
              setShowStickyHeader={setShowStickyHeader}
              negotiationData={negotiationData}
              userData={userData}
            />

            <ClientOverviewCard
              negotiationStatus={negotiationData[0]?.negotiations_Status ?? ""}
              userData={userData}
              dealNegotiatorData={dealNegotiatorData}
            />
            <IncomingBidsCard
              incomingBids={incomingBids}
              dealerData={dealerData}
            >
              <div className="space-y-8">
                {incomingBids.map((item, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-l-blue-500 pl-4 pb-6"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-[#202125]">
                        {dealerData ? dealerData[index]?.Dealership ?? "" : ""}
                      </h3>
                    </div>
                    <time className="block mb-2 text-sm text-[#202125]">
                      {formatDate(item?.timestamp)}
                    </time>
                    <p className="text-[#202125] mb-4 text-sm">
                      Price: ${item?.price ? item?.price : "No price available"}
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
                              ].some((ext) => file.toLowerCase().includes(ext));
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
                              {dealNegotiatorData?.name}
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
            </IncomingBidsCard>
          </div>

          <div className="md:col-span-1">
            <DealDetailCard
              setShowStickyHeader={setShowStickyHeader}
              negotiationData={negotiationData}
              userData={userData}
              responsive={true}
            />
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="flex justify-center items-center h-[100vh] ">
      <Loader />
    </div>
  );
}

function Profile() {
  return (
    <Suspense fallback={"Loading"}>
      <ProjectProfile />
    </Suspense>
  );
}

export default Profile;
