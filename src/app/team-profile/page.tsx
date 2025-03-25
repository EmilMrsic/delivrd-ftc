"use client";
import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  BellIcon,
  Car,
  Save,
  Pencil,
  X,
  Upload,
  Trash,
} from "lucide-react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, messaging } from "@/firebase/config";
import { ActivityLog, BidComments, IncomingBid } from "@/types";
import {
  formatDate,
  generateRandomId,
  getCurrentTimestamp,
  updateBidInFirebase,
  uploadFile,
} from "@/lib/utils";
import FeatureDetails from "@/components/Team/Feature-details";
import StickyHeader from "@/components/Team/Sticky-header";
import ClientDetails from "@/components/Team/Client-details";
import ManualBidUpload from "@/components/Team/Manual-bid-upload-modal";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { onMessage } from "firebase/messaging";
import { useDispatch } from "react-redux";
import {
  setAllNotifications,
  setNotificationCount,
} from "../redux/Slice/notificationSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import ActivityLogSection from "@/components/Team/activity-log";
import AddNoteSection from "@/components/Team/add-note-section";
import useTeamProfile from "@/hooks/useTeamProfile";
import VoteSection from "@/components/Team/vote-section";
import { useRouter, useSearchParams } from "next/navigation";
import EditableTextArea from "@/components/base/editable-textarea";
import { Input } from "@/components/ui/input";
import EditableInput from "@/components/base/input-field";
import axios from "axios";
import TradeCard from "@/components/Team/trade-card";
import DeleteBidSection from "@/components/Team/delete-bid-section";
import { TeamHeader } from "@/components/base/header";
import { DealNegotiatorType } from "@/lib/models/team";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { IncomingBidCard } from "@/components/Team/profile/incoming-bid";
import { IncomingBids } from "@/components/Team/profile/incoming-bids";
import { ClientProfile } from "@/components/Team/profile/client-profile";

function Profile() {
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const params = useSearchParams();
  const negotiationId = params.get("id");

  return (
    <Suspense fallback={"Loading"}>
      {negotiationId && (
        <div className="container mx-auto p-4 space-y-6 min-h-screen w-[90vw]">
          <TeamHeader
          // negotiatorData={dealNegotiator as unknown as DealNegotiatorType}
          />

          {/* {showStickyHeader && <StickyHeader negotiation={negotiation} />} */}
          <ClientProfile negotiationId={negotiationId} />
        </div>
      )}
    </Suspense>
  );
}

export default Profile;
