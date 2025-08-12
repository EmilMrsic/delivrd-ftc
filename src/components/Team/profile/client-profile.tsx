import { setAllNotifications } from "@/app/redux/Slice/notificationSlice";
import { db, messaging } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import useTeamProfile from "@/hooks/useTeamProfile";
import {
  generateRandomId,
  getActivityLogsByNegotiationId,
  getCurrentTimestamp,
  updateBidInFirebase,
  uploadFile,
} from "@/lib/utils";
import { ActivityLog, BidComments } from "@/types";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import ClientDetails from "../Client-details";
import { IncomingBids } from "./incoming-bids";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import DeleteBidSection from "../delete-bid-section";
import AddNoteSection from "../add-note-section";
import ActivityLogSection from "../activity-log";
import FeatureDetails from "../Feature-details";
import TradeCard from "../trade-card";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import EditableTextArea from "@/components/base/editable-textarea";
import { Loader } from "@/components/base/loader";
import WorkLogSection from "../work-log-section";
import { Button } from "@/components/ui/button";
import { FileText, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useCheckClientShareExpiry from "@/hooks/useCheckExpiration";
import useClientShareExpired from "@/hooks/useCheckExpiration";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { IncomingBidCommentType, IncomingBidType } from "@/lib/models/bids";
import { createNotification } from "@/lib/helpers/notifications";
import ManualBidUpload from "../Manual-bid-upload-modal";
import { TabSelector } from "@/components/base/tab-selector";
import { useNegotiationBids } from "@/hooks/useNegotiationBids";
import { BidList } from "./bid-list";
import { DealSelection } from "./deal-selection";
import { useNegotiationStore } from "@/lib/state/negotiation";

export const ClientProfile = ({
  negotiationId,
  clientMode: clientModeProp,
  allowClientModeToggle,
}: {
  negotiationId: string;
  clientMode?: boolean;
  allowClientModeToggle?: boolean;
}) => {
  const setNegotiationInStore = useNegotiationStore(
    (state) => state.setNegotiation
  );
  const setNegotiation = (updatedNegotiation: NegotiationDataType) => {
    setNegotiationInStore(negotiationId, updatedNegotiation);
  };
  const [clientMode, setClientMode] = useState<boolean>(
    clientModeProp ?? false
  );
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [clientDeals, setClientDeals] = useState<
    | {
        id: string;
        make: string;
        model: string;
      }[]
    | null
  >(null);

  const {
    dealNegotiator,
    dealers,
    user,
    allDealNegotiator,
    negotiation,
    incomingBids,
    setIncomingBids,
    bidCommentsByBidId,
    setBidCommentsByBidId,
    isLoading,
    setDealers,
    refetch,
    fetchBidComments,
    fetchBids,
  } = useTeamProfile({ negotiationId });
  const {
    data: clientBids,
    isLoading: clientBidsLoading,
    refetch: refetchNegotiationBids,
  } = useNegotiationBids({
    negotiationId: negotiationId,
  });

  const dispatch = useDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const shared = params.get("shared");
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [commentingBidId, setCommentingBidId] = useState<string | null>(null);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [showDeletedBids, setShowDeletedBids] = useState<boolean>(false);
  const [editedBid, setEditedBid] = useState({
    price: "",
    discountPrice: "",
    inventoryStatus: "In Stock",
    files: [""],
  });
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  const refetchBids = async () => {
    console.log("rerunning: refetchBids");
    await fetchBids();
    await fetchBidComments();
    await refetchNegotiationBids();
  };

  useEffect(() => {
    if (negotiation && !clientDeals) {
      (async () => {
        const deals = await getDocs(
          query(
            collection(db, "delivrd_negotiations"),
            where("userId", "==", negotiation.userId)
          )
        );
        const dealIds = deals.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            make: data.brand,
            model: data.model,
          };
        });
        console.log("dealIds:", dealIds);
        setClientDeals(dealIds);
      })();
    }
  }, [negotiation]);

  useEffect(() => {
    const bidId = params.get("bid");
    if (!isLoading && bidId) {
      // Create a MutationObserver to watch for the element
      const observer = new MutationObserver((mutations, obs) => {
        const el = document.getElementById(`bid_${bidId}`);
        if (el) {
          // Element found, scroll to it
          const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({
            top: y,
            behavior: "smooth",
          });
          // Disconnect the observer since we found the element
          obs.disconnect();
        }
      });

      // Start observing the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Cleanup observer on unmount
      return () => observer.disconnect();
    }
  }, [params, isLoading]);

  const [activityLog, setActivityLog] = useState<ActivityLog>();
  // http://localhost:3000/team-profile?id=recH85js7w4MRVDru
  const addComment = async (bid_id: string) => {
    if (!newComment[bid_id]?.trim()) return;

    const newCommentData: IncomingBidCommentType = {
      client_phone_number: negotiation?.clientPhone ?? "",
      bid_id,
      client_name: negotiation?.clientNamefull ?? "",
      client: negotiation?.clientNamefull ?? "",
      comment: newComment[bid_id],
      deal_coordinator: dealNegotiator?.id ?? "",
      deal_coordinator_name: dealNegotiator?.name ?? "",
      link_status: "Active",
      negotiation_id: negotiationId ?? "",
      time: getCurrentTimestamp(),
      client_id: "N/A",
      source: user.privilege === "Client" ? "Client" : "Team",
      author: user,
    };

    // @ts-ignore
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

    if (user.privilege === "Client") {
      handleSendComment(newCommentData);
    }

    if (dealNegotiator?.id) {
      await createNotification(dealNegotiator?.id, "bid_comment", {
        bidId: bid_id,
        negotiationId: negotiationId,
        author: user.id,
      });
    }

    toast({ title: "Comment added successfully" });
  };

  const handleChange = (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => {
    // (prevState: any) => {
    if (!negotiation) return;

    const { key, newValue, parentKey } = updateObject;

    let value = newValue;
    let keyName = parentKey ? parentKey : key;
    if (parentKey) {
      const parentVal = negotiation[parentKey as keyof NegotiationDataType];
      if (typeof parentVal === "object" && parentVal !== null) {
        // @ts-ignore
        value = {
          ...(parentVal as Record<string, unknown>),
          [key]: newValue,
        };
      }
    }

    //   return {
    //     ...prevState,
    //     [keyName]: value,
    //   };
    // }
    setNegotiation({
      ...negotiation,
      [keyName]: value,
    });
  };

  const parseComment = (comment: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return comment.split(urlRegex).map((part: string, index: number) => {
      if (urlRegex.test(part)) {
        return (
          <Link
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-wrap break-words"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onMessage(messaging, (data: any) => {
        const newData = { ...data.notification, ...data.data };
        if (newData) dispatch(setAllNotifications(newData));
      });

      console.log("Notification listener initialized");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [dispatch]);

  const handleEdit = (bid: any) => {
    setEditingBidId(bid.bid_id);
    setEditedBid({
      price: bid.price.toString(),
      discountPrice: bid.discountPrice.toString(),
      inventoryStatus: bid.inventoryStatus,
      files: bid.files,
    });
  };

  const handleSave = (bidId: string) => {
    setIncomingBids(
      incomingBids.map((bid) =>
        bid.bid_id === bidId
          ? {
              ...bid,
              ...editedBid,
              price: Number(editedBid.price),
              discountPrice: String(editedBid.discountPrice),
            }
          : bid
      )
    );
    updateBidInFirebase(bidId, {
      discountPrice: editedBid.discountPrice,
      inventoryStatus: editedBid.inventoryStatus,
      price: Number(editedBid.price),
      files: editedBid.files,
    });
    setOpenDialog(null);
    setEditingBidId(null);
    toast({ title: "Bid Updated successfully" });
  };

  const handleDeleteBid = async (bidId: string) => {
    const bid_id = bidId;
    const updatedBids = incomingBids.map((bid) =>
      bid.bid_id === bidId ? { ...bid, delete: true } : bid
    );
    setIncomingBids(updatedBids);

    const bidDocRef = doc(db, "Incoming Bids", bid_id);

    try {
      await updateDoc(bidDocRef, { delete: true });
      console.log("Bid marked as deleted in Firebase");
      toast({ title: "Bid marked as deleted" });
    } catch (error) {
      console.error("Error updating bid in Firebase: ", error);
    }
    logActivity(user.name, "A bid has been deleted");
  };

  const handleBidFileUpload = async (
    changeFiles: FileList | null,
    bidId: string
  ) => {
    if (!changeFiles) return;

    let fileUrls: string[] = [];
    const fileArray = Array.from(changeFiles);

    const uploadPromises = fileArray.map((file) => uploadFile(file)); // Upload files
    fileUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    setEditedBid({
      ...editedBid,
      files: [...editedBid.files, ...fileUrls],
    });

    updateBidInFirebase(bidId, {
      files: [...editedBid.files, ...fileUrls],
    });

    setIncomingBids((incomingBids) => {
      return incomingBids.map((bid) => {
        if (bid.bid_id === bidId) {
          // Add the new files to the correct bid in the incomingBids state
          return {
            ...bid,
            files: [...bid.files, ...fileUrls],
          };
        }
        return bid;
      });
    });
  };

  const logActivity = async (name: string, actionDescription: string) => {
    const today = new Date();
    const day = today.toLocaleString("en-US", { weekday: "long" });
    const time = today.toISOString().split("T")[0];

    const newActivityLog = {
      id: generateRandomId(),
      day,
      time,
      description: actionDescription,
      user: name,
      negotiationId,
    };

    const useableActivityLog = activityLog ?? [];

    setActivityLog([...useableActivityLog, newActivityLog]);
    console.log(activityLog);
    await addDoc(collection(db, "activity log"), newActivityLog);
  };

  const handleDeleteFile = (fileToDelete: string, bidId: string) => {
    setEditedBid((prevEditedBid) => ({
      ...prevEditedBid,
      files: prevEditedBid.files.filter((file) => file !== fileToDelete),
    }));

    updateBidInFirebase(bidId, {
      files: editedBid.files.filter((file) => file !== fileToDelete),
    });

    setIncomingBids((incomingBids) => {
      return incomingBids.map((bid) => {
        if (bid.bid_id === bidId) {
          return {
            ...bid,
            files: bid.files.filter((file) => file !== fileToDelete),
          };
        }
        return bid;
      });
    });
  };

  const handleSendComment = async (data: IncomingBidCommentType) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_COMMENT_FUNC_URL ?? "",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast({
          title: `Comment sent to ${
            user.privilege === "Client" ? "The Delivrd Team" : "client"
          }`,
        });
      } else {
        console.error("Failed to send comment:", result);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const shareProgress = async () => {
    if (typeof window !== "undefined" && navigator) {
      const id = generateRandomId();
      window.navigator.clipboard.writeText(
        `${window.location.href}?shared=${id}`
      );

      await setDoc(doc(db, "delivrd_client_share", id), {
        id,
        createdAt: serverTimestamp(),
        clientId: user.id,
      });
    }
    toast({
      title: "Link copied to clipboard",
    });
  };

  useEffect(() => {
    getActivityLogsByNegotiationId(negotiationId ?? "").then((log) => {
      setActivityLog(log as ActivityLog);
    });
  }, [negotiationId]);

  if (isLoading || !negotiation) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-[98%] mx-auto">
      <div className="md:col-span-2">
        <div className="space-y-6">
          {/* <div className="md:hidden">
                <FeatureDetails
                  setShowStickyHeader={setShowStickyHeader}
                  negotiation={negotiation}
                  negotiationId={negotiationId}
                  handleChange={handleChange}
                />
              </div> */}

          <ClientDetails
            handleChange={handleChange}
            negotiation={negotiation}
            dealNegotiator={dealNegotiator}
            negotiationId={negotiationId}
            clientMode={clientMode}
            setClientMode={setClientMode}
            allowClientModeToggle={allowClientModeToggle}
            allDealNegotiator={allDealNegotiator}
          />

          {clientBidsLoading ? (
            <Loader />
          ) : (
            <BidSection
              setIncomingBids={setIncomingBids}
              incomingBids={incomingBids}
              negotiationId={negotiationId}
              dealers={dealers}
              setDealers={setDealers}
              handleDeleteBid={handleDeleteBid}
              handleEdit={handleEdit}
              handleSave={handleSave}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
              setEditingBidId={setEditingBidId}
              setCommentingBidId={setCommentingBidId}
              commentingBidId={commentingBidId}
              newComment={newComment}
              setNewComment={setNewComment}
              addComment={addComment}
              bidCommentsByBidId={bidCommentsByBidId}
              parseComment={parseComment}
              editingBidId={editingBidId}
              editedBid={editedBid}
              setEditedBid={setEditedBid}
              clientMode={clientMode}
              handleBidFileUpload={handleBidFileUpload}
              handleDeleteFile={handleDeleteFile}
              negotiation={negotiation}
              showDeletedBids={showDeletedBids}
              handleSendComment={handleSendComment}
              clientBids={clientBids.bids}
              dealNegotiator={dealNegotiator}
              refetch={refetchBids}
            />
          )}

          {!clientMode && (
            <>
              <AddNoteSection
                user={user}
                setNegotiation={setNegotiation}
                negotiation={negotiation}
                incomingBids={incomingBids}
                allDealNegotiator={allDealNegotiator}
                dealNegotiator={dealNegotiator}
              />
            </>
          )}
          <WorkLogSection
            negotiationId={negotiationId}
            user={user}
            noActions={clientMode}
            negotiation={negotiation as NegotiationDataType}
          />
          {!clientMode && (
            <>
              <ActivityLogSection activityLog={activityLog ?? []} />
              <div className="banner bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-lg shadow-xl flex justify-between items-center max-w-4xl mx-auto my-4">
                <div>
                  <p className="text-xl font-bold">Delivrd</p>
                  <p className="text-sm mt-1 opacity-75">
                    Click on the button to show or hide deleted bids
                  </p>
                </div>
                <button
                  onClick={() => setShowDeletedBids(!showDeletedBids)}
                  className="px-6 py-3 bg-white text-black hover:bg-black hover:text-white  rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                >
                  {showDeletedBids ? "Hide Deleted Bids" : "Show Deleted Bids"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="md:col-span-1">
        {/* md:sticky  */}
        <div className="space-y-6">
          {!clientMode && clientDeals && (
            <DealSelection
              currentDeal={negotiation}
              clientDeals={clientDeals}
            />
          )}
          <FeatureDetails
            negotiation={negotiation}
            negotiationId={negotiationId}
            handleChange={handleChange}
            clientMode={clientMode}
          />

          {/* {clientMode && !shared && (
            <Button
              onClick={shareProgress}
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Your Deal Progress
            </Button>
          )} */}

          {!clientMode && (
            <TailwindPlusCard title="Consult Notes">
              <EditableTextArea
                value={
                  negotiation?.consultNotes ?? "No consult notes at the moment"
                }
                negotiationId={negotiationId ?? ""}
                field="consultNotes"
                onChange={(newValue) =>
                  handleChange({
                    key: "consultNotes",
                    newValue: newValue,
                  })
                }
              />
            </TailwindPlusCard>
          )}

          <TradeCard
            negotiation={negotiation}
            handleChange={handleChange}
            setNegotiation={setNegotiation}
          />

          {!clientMode && (
            <TailwindPlusCard title="Shipping Info">
              <EditableTextArea
                value={
                  negotiation?.shippingInfo ?? "No shipping info at the moment"
                }
                negotiationId={negotiationId ?? ""}
                field="shippingInfo"
                onChange={(newValue) =>
                  handleChange({
                    key: "shippingInfo",
                    newValue: newValue,
                  })
                }
              />
            </TailwindPlusCard>
          )}
        </div>
      </div>
    </div>
  );
};

export const BidSection = ({
  setIncomingBids,
  incomingBids,
  negotiationId,
  dealers,
  setDealers,
  handleDeleteBid,
  handleEdit,
  handleSave,
  openDialog,
  setOpenDialog,
  setEditingBidId,
  setCommentingBidId,
  commentingBidId,
  newComment,
  setNewComment,
  addComment,
  bidCommentsByBidId,
  parseComment,
  editingBidId,
  editedBid,
  setEditedBid,
  clientMode,
  handleBidFileUpload,
  handleDeleteFile,
  negotiation,
  showDeletedBids,
  handleSendComment,
  noUserActions = false,
  clientBids,
  dealNegotiator,
  refetch,
}: any & {
  clientBids: {
    [key: string]: IncomingBidType[];
  };
  refetch: () => void;
}) => {
  const [tab, setTab] = useState<"bids" | "tradeIns">("bids");
  const offersInfo = useMemo(() => {
    const allBids = [
      ...(clientBids.bids ?? []),
      ...(clientBids.tradeIns ?? []),
    ];

    const hasAcceptedOffer = allBids.some((bid: IncomingBidType) => {
      const result = !bid.delete && bid.client_offer === "accepted";
      return result;
    });

    const hasAcceptedBid = allBids.some((bid: IncomingBidType) => {
      const result = !bid.delete && bid.accept_offer === true;
      if (result) {
        console.log("found winner:", bid);
      }
      return result;
    });

    console.log("rerunning:", hasAcceptedOffer, hasAcceptedBid);

    return {
      hasAcceptedOffer: hasAcceptedOffer || false,
      hasAcceptedBid: hasAcceptedBid || false,
    };
  }, [clientBids, incomingBids]);

  return (
    <TailwindPlusCard
      title={tab === "bids" ? "Incoming Bids" : "Trade Ins"}
      icon={FileText}
      actions={() => {
        if (noUserActions || clientMode || tab === "tradeIns") return null;
        return (
          <ManualBidUpload
            dealers={dealers}
            setDealers={setDealers}
            setIncomingBids={setIncomingBids}
            incomingBids={incomingBids}
            id={negotiationId}
            negotiation={negotiation}
          />
        );
      }}
    >
      <TabSelector
        options={{
          bids: "Incoming Bids",
          tradeIns: "Trade Ins",
        }}
        value={tab}
        setValue={(value) => setTab(value as "bids" | "tradeIns")}
      />

      {tab === "bids" && (
        <IncomingBids
          setIncomingBids={setIncomingBids}
          incomingBids={incomingBids}
          negotiationId={negotiationId ?? ""}
          dealers={dealers}
          setDealers={setDealers}
          handleDeleteBid={handleDeleteBid}
          handleEdit={handleEdit}
          handleSave={handleSave}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          setEditingBidId={setEditingBidId}
          setCommentingBidId={setCommentingBidId}
          commentingBidId={commentingBidId}
          newComment={newComment}
          setNewComment={setNewComment}
          addComment={addComment}
          bidCommentsByBidId={bidCommentsByBidId}
          parseComment={parseComment}
          // @ts-ignore
          handleSendComment={handleSendComment}
          editingBidId={editingBidId}
          editedBid={editedBid}
          setEditedBid={setEditedBid}
          clientMode={clientMode}
          handleBidFileUpload={handleBidFileUpload}
          handleDeleteFile={handleDeleteFile}
          negotiation={negotiation as NegotiationDataType}
          refetch={refetch}
          offersInfo={offersInfo}
        />
      )}
      {tab === "tradeIns" && (
        <BidList
          bids={clientBids.tradeIns ?? []}
          noUserActions={noUserActions}
          clientMode={clientMode}
          negotiation={negotiation as NegotiationDataType}
          dealCoordinator={dealNegotiator}
          mode="tradeIns"
          offersInfo={offersInfo}
          refetch={refetch}
        />
      )}
      {!clientMode && (
        <>
          {showDeletedBids && (
            <DeleteBidSection
              incomingBids={incomingBids}
              negotiationId={negotiationId}
              dealers={dealers}
              setCommentingBidId={setCommentingBidId}
              setEditedBid={setEditedBid}
              setEditingBidId={setEditingBidId}
              editedBid={editedBid}
              editingBidId={editingBidId}
              commentingBidId={commentingBidId}
              setNewComment={setNewComment}
              newComment={newComment}
              addComment={addComment}
              handleBidFileUpload={handleBidFileUpload}
              handleDeleteFile={handleDeleteFile}
              handleEdit={handleEdit}
              handleSave={handleSave}
              setOpenDialog={setOpenDialog}
              openDialog={openDialog}
              setIncomingBids={setIncomingBids}
            />
          )}
        </>
      )}
    </TailwindPlusCard>
  );
};
