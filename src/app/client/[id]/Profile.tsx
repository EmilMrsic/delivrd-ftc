"use client";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  BidComments,
  DealerData,
  DealNegotiator,
  IncomingBid,
  IUser,
  NegotiationData,
} from "@/types";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { formatDate, getCurrentTimestamp, uploadFile } from "@/lib/utils";
import { usePathname } from "next/navigation";
import DealDetailCard from "@/components/Client/DealDetailCard";
import ClientOverviewCard from "@/components/Client/ClientOverviewCard";
import IncomingBidsCard from "@/components/Client/IncomingBidsCard/IncomingBidsCard";
import ClientStickyHeader from "@/components/Client/ClientStickyHeader";
import { Loader } from "@/components/base/loader";
import { Car, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditableTextArea from "@/components/base/editable-textarea";
import EditableInput from "@/components/base/input-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type GroupedBidComments = {
  [bid_id: string]: BidComments[];
};

function ProjectProfile() {
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const [negotiationData, setNegotiationData] = useState<NegotiationData[]>([]);
  const [commentingBidId, setCommentingBidId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const [bidCommentsByBidId, setBidCommentsByBidId] =
    useState<GroupedBidComments>({});
  const [acceptedBidId, setAcceptedBidId] = useState<string | null>(null);
  const [dealerData, setDealerData] = useState<DealerData[]>([]);
  const [dealNegotiatorData, setDealNegotiatorData] =
    useState<DealNegotiator>();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const [userData, setUserData] = useState<IUser>();
  const [tradeInInfo, setTradeInInfo] = useState(
    negotiationData[0]?.trade_in_info ?? "No trade in info at the moment"
  );
  const [tradeInVin, setTradeInVin] = useState(
    negotiationData[0]?.trade_in_vin ?? ""
  );
  const [tradeInMileage, setTradeInMileage] = useState(
    negotiationData[0]?.trade_in_mileage ?? ""
  );
  const [tradeInComments, setTradeInComments] = useState(
    negotiationData[0]?.trade_in_comments ?? ""
  );

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
  const fetchBidComments = async () => {
    const groupedBidComments: GroupedBidComments = {};
    const bidCommentsRef = collection(db, "bid comment");

    for (const bid of incomingBids) {
      const bid_id = bid.bid_id;

      try {
        const bidCommentQuery = query(
          bidCommentsRef,
          where("bid_id", "==", bid_id)
        );

        const bidCommentSnap = await getDocs(bidCommentQuery);

        if (!bidCommentSnap.empty) {
          bidCommentSnap.forEach((doc) => {
            const bidCommentData = doc.data() as BidComments;

            if (!groupedBidComments[bid_id]) {
              groupedBidComments[bid_id] = [];
            }

            groupedBidComments[bid_id].push(bidCommentData);
          });
        } else {
          console.warn(`No comments found for bid ID ${bid_id}`);
        }
      } catch (error) {
        console.error(`Error fetching bid comment for ID ${bid_id}:`, error);
      }
    }

    setBidCommentsByBidId(groupedBidComments);
  };
  const fetchNegotiationsAndBids = async () => {
    let userNegotiationIds: string[] = [];

    try {
      // If userData doesn't exist, fetch user from Firestore
      if (!userData) {
        if (!id) {
          console.error("User ID is missing.");
          return;
        }

        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error("User not found.");
          return;
        }

        const user = userSnap.data();
        userNegotiationIds = user.negotiation_id || [];
      } else {
        userNegotiationIds = userData.negotiation_id || [];
      }

      if (!userNegotiationIds.length) return;

      const allIncomingBids: IncomingBid[] = [];
      const negotiation: NegotiationData[] = [];

      for (const negotiationId of userNegotiationIds) {
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

  const acceptOffer = async (bid_id: string) => {
    // Update the selected bid
    const bidRef = doc(db, "Incoming Bids", bid_id);

    // Update Firestore
    await updateDoc(bidRef, {
      client_offer: "accepted",
    });
    const updatedBids = incomingBids.map((bid) =>
      bid.bid_id === bid_id ? { ...bid, client_offer: "accepted" } : bid
    );

    // Move the accepted bid to the top
    const acceptedBid: any = updatedBids.find((bid) => bid.bid_id === bid_id);
    const otherBids = updatedBids.filter((bid) => bid.bid_id !== bid_id);

    setIncomingBids([acceptedBid, ...otherBids]);
    setAcceptedBidId(bid_id);
    toast({
      title:
        "Your deal has been sent to your deal coordinator, who will contact you shortly.",
    });
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
    if (userData && userData?.deal_negotiator)
      handleSetDealNegotiatorData(userData?.deal_negotiator[0] ?? "");
  }, [userData]);

  useEffect(() => {
    fetchNegotiationsAndBids();
  }, [dealNegotiatorData]);

  useEffect(() => {
    const fetchDealersData = async (incomingBid: IncomingBid[]) => {
      try {
        const dealerPromises = incomingBid.map(async (bid) => {
          console.log(bid.dealerId);
          const q = query(
            collection(db, "Dealers"),
            where("id", "==", bid.dealerId ?? "")
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
    fetchBidComments();
  }, [incomingBids]);

  const handleTradeInInfoChange = (e: any) => {
    setTradeInInfo(e.target.value);
  };

  const handleTradeInVinChange = (e: any) => {
    setTradeInVin(e.target.value);
  };

  const handleTradeInMileageChange = (e: any) => {
    setTradeInMileage(e.target.value);
  };

  const handleTradeInCommentsChange = (e: any) => {
    setTradeInComments(e.target.value);
  };

  const saveToFirebase = async (field: string, value: string) => {
    try {
      const negotiationId = negotiationData[0]?.id;
      await setDoc(
        doc(db, "negotiations", negotiationId),
        {
          [field]: value,
        },
        { merge: true }
      );
      console.log(`${field} saved successfully.`);
      toast({ title: `${field} saved successfully.` });
    } catch (error) {
      console.error("Error saving data to Firebase:", error);
    }
  };

  const handleTradeInInfoBlur = () => {
    saveToFirebase("trade_in_info", tradeInInfo);
  };

  const handleTradeInVinBlur = () => {
    saveToFirebase("trade_in_vin", tradeInVin);
  };

  const handleTradeInMileageBlur = () => {
    saveToFirebase("trade_in_mileage", tradeInMileage);
  };

  const handleTradeInCommentsBlur = () => {
    saveToFirebase("trade_in_comments", tradeInComments);
  };

  const handleFileUpload = async (files: FileList | null, bidId: string) => {
    const id = bidId;
    if (!files || !bidId) return;

    let fileUrls: string[] = [];

    if (files.length > 0) {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map((file) => uploadFile(file));
      fileUrls = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as string[];
    }

    if (fileUrls.length > 0) {
      const bidRef = doc(db, "negotiations", id);
      await updateDoc(bidRef, {
        trade_in_files: arrayUnion(...fileUrls),
      });
    }
    const updatedNegotiationData = [...negotiationData];
    updatedNegotiationData[0].trade_in_files = [
      ...(updatedNegotiationData[0].trade_in_files ?? []),
      ...fileUrls,
    ];
    setNegotiationData(updatedNegotiationData); // Assuming you have a state setter for negotiationData
    toast({ title: "Files uploaded" });
  };

  const handleRemoveFile = async (fileUrl: string) => {
    if (!negotiationData[0]) return;

    const bidRef = doc(db, "negotiations", negotiationData[0].id); // Assuming negotiation has an `id`

    try {
      // Remove file from Firebase Firestore
      await updateDoc(bidRef, {
        trade_in_files: arrayRemove(fileUrl),
      });

      if (negotiationData[0] !== null) {
        setNegotiationData((prevData) => {
          const updatedNegotiation = {
            ...prevData[0],
            trade_in_files: prevData[0].trade_in_files?.filter(
              (file) => file !== fileUrl
            ),
          };

          return [updatedNegotiation, ...prevData.slice(1)];
        });
      }

      toast({ title: "File removed" }); // Show a success message
    } catch (error) {
      console.error("Error removing file:", error);
      toast({ title: "Failed to remove file" });
    }
  };

  useEffect(() => {
    setTradeInInfo(
      negotiationData[0]?.trade_in_info ?? "No trade in info at the moment"
    );
    setTradeInVin(negotiationData[0]?.trade_in_vin ?? "");
    setTradeInMileage(negotiationData[0]?.trade_in_mileage ?? "");
    setTradeInComments(negotiationData[0]?.trade_in_comments ?? "");
  }, [negotiationData]);

  const addComment = async (bid_id: string) => {
    if (!newComment[bid_id]?.trim()) return;

    const newCommentData: BidComments = {
      client_phone_number: negotiationData[0].negotiations_Phone ?? "",
      bid_id,
      client: userData?.name ?? "",
      client_name: userData?.name ?? "",
      comment_source: "Client",
      comment: newComment[bid_id],
      deal_coordinator: userData?.id ?? "",
      deal_coordinator_name: "N/A",
      link_status: "Active",
      negotiation_id: negotiationData[0].id,
      time: getCurrentTimestamp(),
      client_id: userData?.id ?? "",
    };

    setBidCommentsByBidId((prev) => ({
      ...prev,
      [bid_id]: [...(prev[bid_id] || []), newCommentData],
    }));

    setNewComment((prev) => ({
      ...prev,
      [bid_id]: "",
    }));
    const commentRef = collection(db, "bid comment");
    await addDoc(commentRef, newCommentData);
    toast({ title: "Comment added successfully" });
  };

  return userData && incomingBids && dealerData && negotiationData ? (
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
                {incomingBids
                  ?.filter((bid) => bid?.timestamp)
                  .sort((a, b) => {
                    if (a.client_offer === "accepted") return -1;
                    if (b.client_offer === "accepted") return 1;
                    const dateA = new Date(a?.timestamp || 0).getTime();
                    const dateB = new Date(b?.timestamp || 0).getTime();
                    return dateB - dateA; // Newest bids first
                  })
                  .map((item, index) => {
                    const matchingDealer = dealerData.find(
                      (dealer) => dealer?.id === item.dealerId
                    );
                    const hasAcceptedOffer = incomingBids.find(
                      (bid) => bid.client_offer === "accepted"
                    );
                    return (
                      <div
                        key={index}
                        className={`pr-2 pt-2 border-l-4 pl-4 pb-6 ${
                          hasAcceptedOffer && item.client_offer !== "accepted"
                            ? "opacity-45 pointer-events-none"
                            : ""
                        } ${
                          item.vote && item.vote === "like"
                            ? "bg-green-100 border-green-600 "
                            : item.vote === "dislike"
                            ? "bg-orange-100 border-orange-600"
                            : "bg-white border-blue-600"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-[#202125]">
                            {matchingDealer
                              ? matchingDealer?.Dealership ?? ""
                              : ""}
                          </h3>
                          <div className="flex space-x-2">
                            {item.vote === "like" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className={"bg-green-500 text-white"}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            ) : item.vote === "dislike" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className={"bg-yellow-500 text-white"}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                        <time className="block mb-2 text-sm text-[#202125]">
                          {formatDate(item?.timestamp)}
                        </time>
                        <p className="text-[#202125] mb-4 text-sm">
                          Price: $
                          {item?.price ? item?.price : "No price available"}
                        </p>
                        <div className="flex gap-3">
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
                                        onClick={() =>
                                          window.open(file, "_blank")
                                        }
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
                                    <p className="text-gray-500">
                                      Date Submitted
                                    </p>
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
                          <Button
                            onClick={() => acceptOffer(item.bid_id)}
                            key={"accept" + index}
                            variant="outline"
                            size="sm"
                            disabled={item.client_offer === "accepted"}
                          >
                            {item.client_offer === "accepted"
                              ? "Offer Accepted"
                              : "Accept Offer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCommentingBidId(
                                commentingBidId === item.bid_id
                                  ? null
                                  : item.bid_id
                              )
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Comment
                          </Button>
                        </div>
                        {commentingBidId === item.bid_id && (
                          <div className="mb-4">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment[item.bid_id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [item.bid_id]: e.target.value,
                                }))
                              }
                              className="mb-2"
                            />
                            <Button onClick={() => addComment(item.bid_id)}>
                              Submit Comment
                            </Button>
                          </div>
                        )}
                        {bidCommentsByBidId[item?.bid_id] &&
                        bidCommentsByBidId[item?.bid_id].length > 0 ? (
                          bidCommentsByBidId[item?.bid_id].map(
                            (comment, index) => (
                              <div
                                key={index}
                                className="p-2 bg-gray-100 rounded mt-1"
                              >
                                <p>
                                  <strong>
                                    {comment.deal_coordinator_name === "N/A"
                                      ? comment.client_name
                                      : comment.deal_coordinator_name}
                                    :
                                  </strong>{" "}
                                  {parseComment(comment.comment)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {comment.time}
                                </p>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-500">
                            No comments available for this bid.
                          </p>
                        )}{" "}
                      </div>
                    );
                  })}
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
          <div></div>
          <div></div>
          <Card className="bg-white shadow-lg mb-5">
            <CardHeader className="bg-gradient-to-r from-[#202125] to-[#0989E5] text-white">
              <CardTitle className="flex items-center">
                <Car className="mr-2" /> Trade In Info
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 mt-2">
              <textarea
                className="border rounded-md p-2"
                value={tradeInInfo}
                onChange={handleTradeInInfoChange}
                onBlur={handleTradeInInfoBlur}
              />
              <div className="flex items-center gap-2">
                <label className="font-bold" htmlFor="tradeInVin">
                  Trade-In VIN:
                </label>
                <Input
                  id="tradeInVin"
                  value={tradeInVin}
                  onChange={handleTradeInVinChange}
                  onBlur={handleTradeInVinBlur}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold" htmlFor="tradeInMileage">
                  Trade-In Mileage:
                </label>
                <Input
                  id="tradeInMileage"
                  value={tradeInMileage}
                  onChange={handleTradeInMileageChange}
                  onBlur={handleTradeInMileageBlur}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold" htmlFor="tradeInComments">
                  Trade-In Comments:
                </label>
                <Input
                  id="tradeInComments"
                  value={tradeInComments}
                  onChange={handleTradeInCommentsChange}
                  onBlur={handleTradeInCommentsBlur}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Files
                </label>
                <input
                  type="file"
                  multiple
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  onChange={(e) =>
                    handleFileUpload(
                      e.target.files,
                      negotiationData[0].id ?? ""
                    )
                  }
                />
              </div>

              {/* Display Uploaded Files */}
              <div className="flex space-x-4 mt-2">
                {negotiationData[0]?.trade_in_files?.map((file, index) => {
                  const isImage = [
                    "jpg",
                    "jpeg",
                    "png",
                    "gif",
                    "bmp",
                    "webp",
                  ].some((ext) => file.toLowerCase().includes(ext));
                  return (
                    <div key={index} className="relative w-20 h-20">
                      <div
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
                          />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening file when clicking the cross
                          handleRemoveFile(file);
                        }}
                        className="absolute top-[-10px] right-[-10px] bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
