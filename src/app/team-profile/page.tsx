"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import {
  Phone,
  User,
  Car,
  DollarSign,
  FileText,
  X,
  Mail,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Send,
  Play,
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

interface VoteState {
  [key: string]: number; // Maps dealership names to votes (1 for upvote, -1 for downvote)
}

interface CommentState {
  [key: string]: string[]; // Maps dealership names to comments
}

type ActivityLog = {
  timestamp: string;
  action: string;
  user: string;
}[];

type ClientDetails = {
  phone: string;
  email: string;
  zip: string;
  city: string;
  state: string;
  dealStage: string;
  startDate: string;
};

type OfferDetail = {
  images: string[];
  details: string;
};

type OfferDetails = {
  [key: string]: OfferDetail;
};

type DealDetails = {
  condition: string;
  make: string;
  model: string;
  trim: string;
  drivetrain: string;
  tradeIn: string;
  financeType: string;
  budget: string;
  monthlyBudget: string;
  desiredColors: {
    exterior: string;
    interior: string;
  };
  dealBreakers: {
    exterior: string;
    interior: string;
  };
  features: string;
};

type ClientField = keyof ClientDetails;
type DealField = keyof DealDetails;

function ProjectProfile() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const params = useSearchParams();
  const negotiationId = params.get("id");
  const [negotiation, setNegotiation] = useState<any>(null);

  const [comments, setComments] = useState<CommentState>({
    "Honda World": [
      "This offer seems to be the best value for money.",
      "The warranty package is quite comprehensive.",
      "I like the free maintenance for the first year.",
    ],
    "AutoNation Honda": [
      "The higher trim level might be worth considering.",
      "The panoramic sunroof is a nice feature.",
    ],
    "Honda of Downtown": [],
  });
  const [votes, setVotes] = useState<VoteState>({
    "Honda World": 1,
    "AutoNation Honda": 1,
    "Honda of Downtown": 1,
  });
  const [newComment, setNewComment] = useState("");
  const [commentingDealership, setCommentingDealership] = useState<
    string | null
  >(null);
  const [activityLog, setActivityLog] = useState<ActivityLog>([
    {
      timestamp: "2023-07-15 09:30:00",
      action: "Deal created",
      user: "Troy Paul",
    },
    {
      timestamp: "2023-07-15 10:15:00",
      action: "Initial offer received from Honda World",
      user: "System",
    },
    {
      timestamp: "2023-07-14 11:00:00",
      action: "Comment added to Honda World offer",
      user: "Troy Paul",
    },
  ]);
  const [internalNotes, setInternalNotes] = useState([
    {
      user: "Troy Paul",
      avatar: "/placeholder.svg?height=40&width=40",
      timestamp: "2023-07-15 11:30:00",
      message:
        "Let's focus on the Honda World offer. It seems the most promising.",
    },
    {
      user: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      timestamp: "2023-07-15 12:15:00",
      message: "Agreed. I'll prepare some additional negotiation points.",
    },
  ]);
  const [newInternalNote, setNewInternalNote] = useState("");
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    phone: "(555) 123-4567",
    email: "brandon.smith@example.com",
    zip: "90210",
    city: "Los Angeles",
    state: "CA",
    dealStage: "Actively Negotiating",
    startDate: "July 1, 2023",
  });
  const [dealDetails, setDealDetails] = useState<DealDetails>({
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [loading, setLoading] = useState(true);

  const dealDetailsRef = useRef(null);

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

  const addComment = (dealership: string) => {
    if (newComment.trim()) {
      setComments((prevComments) => ({
        ...prevComments,
        [dealership]: [...(prevComments[dealership] || []), newComment],
      }));
      setActivityLog((prevLog) => [
        {
          timestamp: new Date().toLocaleString(),
          action: `Comment added to ${dealership} offer`,
          user: "Troy Paul",
        },
        ...prevLog,
      ]);
      setNewComment("");
      setCommentingDealership(null);
    }
  };

  const handleVote = (dealership: string, value: number) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [dealership]: value,
    }));
    setActivityLog((prevLog) => [
      {
        timestamp: new Date().toLocaleString(),
        action: `${value > 0 ? "Liked" : "Disliked"} ${dealership} offer`,
        user: "Troy Paul",
      },
      ...prevLog,
    ]);
  };

  const sendUpdate = (dealership: string) => {
    setActivityLog((prevLog) => [
      {
        timestamp: new Date().toLocaleString(),
        action: `Update sent for ${dealership} offer`,
        user: "Troy Paul",
      },
      ...prevLog,
    ]);
  };

  const getCardBorderColor = (vote: number) => {
    if (vote === 1) return "border-l-green-500";
    if (vote === -1) return "border-l-yellow-500";
    return "border-l-blue-500";
  };

  const getCommentColor = (vote: number) => {
    if (vote === 1) return "bg-green-50";
    if (vote === -1) return "bg-yellow-50";
    return "bg-blue-50";
  };

  const addInternalNote = () => {
    if (newInternalNote.trim()) {
      setInternalNotes((prevNotes) => [
        ...prevNotes,
        {
          user: "Troy Paul",
          avatar: "/placeholder.svg?height=40&width=40",
          timestamp: new Date().toLocaleString(),
          message: newInternalNote,
        },
      ]);
      setNewInternalNote("");
    }
  };

  const handleEditField = (
    field: string,
    value: string | { exterior: string; interior: string },
    section: "client" | "deal"
  ) => {
    if (section === "client") {
      setClientDetails((prev) => ({ ...prev, [field]: value }));
    } else {
      setDealDetails((prev) => ({ ...prev, [field]: value }));
    }
    setEditingField(null);
  };

  const EditableField: React.FC<{
    value: string;
    field: ClientField | DealField;
    section: "deal" | "client";
  }> = ({ value, field, section }) => (
    <span
      onClick={() => setEditingField(field)}
      className="cursor-pointer border-b border-orange-200"
    >
      {editingField === field ? (
        <Input
          value={value}
          onChange={(e) =>
            section === "client"
              ? setClientDetails((prev) => ({
                  ...prev,
                  [field]: e.target.value,
                }))
              : setDealDetails((prev) => ({
                  ...prev,
                  [field]: e.target.value,
                }))
          }
          onBlur={() =>
            handleEditField(
              field,
              section === "client"
                ? clientDetails[field as ClientField]
                : dealDetails[field as DealField],
              section
            )
          }
          className="w-full"
        />
      ) : (
        value
      )}
    </span>
  );
  const offerDetails: OfferDetails = {
    "Honda World": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "This Honda CR-V EX-L AWD is in excellent condition with low mileage. It comes with a comprehensive warranty package and free maintenance for the first year. The leather interior is well-maintained, and all safety features are up-to-date. This offer represents the best value for the client's budget.",
    },
    "AutoNation Honda": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "The AutoNation Honda offer includes a slightly higher-trim CR-V with additional features like a panoramic sunroof and upgraded sound system. While it's slightly above budget, the extra features might justify the cost for some clients. The dealership is also offering an extended warranty at a discounted rate.",
    },
    "Honda of Downtown": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "This offer from Honda of Downtown is for a brand new CR-V with all the latest features. While it's above the client's budget, they're including several premium add-ons like all-weather floor mats, a cargo cover, and a roof rack. The higher price also comes with a more comprehensive warranty package.",
    },
  };

  useEffect(() => {
    const getNegotiation = async () => {
      if (!negotiationId) return;

      try {
        // Reference to the specific document in the 'negotiations' collection
        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        // Fetch the document from Firestore
        const docSnap = await getDoc(negotiationDocRef);

        if (docSnap.exists()) {
          // Set the negotiation data if the document exists
          setNegotiation(docSnap.data() as any);
        } else {
          console.log("No such negotiation!");
        }
      } catch (error) {
        console.error("Error fetching negotiation:", error);
      } finally {
        setLoading(false);
      }
    };

    getNegotiation();
  }, [negotiationId]);

  return (
    <div className="container mx-auto p-4 space-y-6 bg-[#E4E5E9] min-h-screen">
      <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
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
            {negotiation?.negotiations_Client}
          </h1>
        </div>
      </div>

      {showStickyHeader && (
        <div className="md:hidden sticky top-0 z-10 bg-gradient-to-r from-[#202125] to-[#0989E5] text-white p-4 rounded-lg shadow-md space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold flex items-center">
              <Car className="mr-2 h-4 w-4" />
              {negotiation?.negotiations_Brand}{" "}
              {negotiation?.negotiations_Model}
            </span>
            <span>
              <DollarSign className="inline mr-1 h-4 w-4" />
              {negotiation?.negotiations_Budget ?? "No budget available"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>
              <ThumbsUp className="inline mr-1 h-4 w-4" />
              {negotiation?.negotiations_Color_Options ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: negotiation?.negotiations_Color_Options,
                  }}
                />
              ) : (
                "No color options available"
              )}
            </span>
            <span className="flex items-center">
              <DollarSign className="inline mr-1 h-4 w-4" />
              {negotiation?.negotiations_Payment_Budget}/mo
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
              Trade In:{" "}
              {negotiation?.negotiations_Trade_Details ?? "No Trade In"}
            </span>
            <span>{negotiation?.negotiations_How_To_Pay}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>
              <Car className="inline mr-1 h-4 w-4" />
              Drivetrain:{" "}
              {negotiation?.negotiations_Drivetrain ??
                "No Drivetrain Available"}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <EditableField
                            value={value}
                            field={key as keyof ClientDetails}
                            section="deal"
                          />
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
                    {negotiation?.negotiations_Trim_Package_Options ??
                      "No options available"}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Colors</h3>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      <strong>Desired Exterior:</strong>{" "}
                      {dealDetails.desiredColors.exterior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      <strong>Desired Interior:</strong>{" "}
                      {dealDetails.desiredColors.interior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <X className="h-5 w-5 text-red-500" />
                    <span>
                      <strong>Exterior Deal Breakers:</strong>{" "}
                      {dealDetails.dealBreakers.exterior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <X className="h-5 w-5 text-red-500" />
                    <span>
                      <strong>Interior Deal Breakers:</strong>{" "}
                      {dealDetails.dealBreakers.interior}
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
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <Phone className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      Phone:{" "}
                      <EditableField
                        value={negotiation?.negotiations_Phone}
                        field="phone"
                        section="client"
                      />
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <Mail className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      Email:{" "}
                      <EditableField
                        value={clientDetails.email}
                        field="email"
                        section="client"
                      />
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
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Zip:{" "}
                      <EditableField
                        value={negotiation?.negotiations_Zip_Code ?? 0}
                        field="zip"
                        section="client"
                      />
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <FileText className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      Deal Stage:{" "}
                      <EditableField
                        value={
                          negotiation?.negotiations_Status ??
                          "Status not available"
                        }
                        field="dealStage"
                        section="client"
                      />
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
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      City:{" "}
                      <EditableField
                        value={
                          negotiation?.negotiations_Address ??
                          "City not available"
                        }
                        field="city"
                        section="client"
                      />
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
                        d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      State:{" "}
                      <EditableField
                        value={
                          negotiation?.negotiations_Address ??
                          "State not available"
                        }
                        field="state"
                        section="client"
                      />
                    </span>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center space-x-4 mt-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src="/placeholder.svg?height=60&width=60"
                    alt="Staff"
                  />
                  <AvatarFallback>TO</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg text-[#202125]">
                    Troy Paul
                  </div>
                  <div className="text-[#202125]">Deal Negotiator</div>
                  <div className="mt-1 text-sm text-[#202125]">
                    <p>Contact Delivrd (text messages preferred)</p>
                    <p className="font-semibold">(386) 270-3530</p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <img
                          src="/placeholder.svg?height=50&width=70"
                          alt="Video 1 Thumbnail"
                          className="rounded-md"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Video 1</DialogTitle>
                      </DialogHeader>
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <img
                          src="/placeholder.svg?height=50&width=70"
                          alt="Video 2 Thumbnail"
                          className="rounded-md"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Video 2</DialogTitle>
                      </DialogHeader>
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Deal Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {Object.entries(offerDetails || {}).map(
                  ([dealership, details]) => (
                    <div
                      key={dealership}
                      className={`border-l-4 pl-4 pb-6 ${getCardBorderColor(
                        votes[dealership]
                      )}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-[#202125]">
                          {dealership} Offer
                        </h3>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(dealership, 1)}
                            className={
                              votes[dealership] === 1
                                ? "bg-green-500 text-white"
                                : ""
                            }
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(dealership, -1)}
                            className={
                              votes[dealership] === -1
                                ? "bg-yellow-500 text-white"
                                : ""
                            }
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <time className="block mb-2 text-sm text-[#202125]">
                        July 12, 2023
                      </time>
                      <p className="text-[#202125] mb-4">
                        Best offer received: $35,500, 36-month lease, $450/month
                      </p>
                      <div className="flex space-x-2 mb-4">
                        <Dialog
                          open={openDialog === dealership}
                          onOpenChange={(isOpen) =>
                            setOpenDialog(isOpen ? dealership : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              View Offer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>
                                {dealership} Offer Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-3 gap-4">
                                {details.images.map((src, index) => (
                                  <img
                                    key={index}
                                    src={src}
                                    alt={`Offer image ${index + 1}`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-500">
                                {details.details}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCommentingDealership(dealership)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Comment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendUpdate(dealership)}
                          className="bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Update
                        </Button>
                      </div>
                      {commentingDealership === dealership && (
                        <div className="mb-4">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="mb-2"
                          />
                          <Button onClick={() => addComment(dealership)}>
                            Submit Comment
                          </Button>
                        </div>
                      )}
                      {comments[dealership]?.map((comment, index) => (
                        <div
                          key={index}
                          className={`mt-2 p-2 rounded-md ${getCardBorderColor(
                            votes[dealership]
                          )} ${getCommentColor(votes[dealership])}`}
                        >
                          <p className="text-sm text-gray-600">
                            <strong>Troy Paul:</strong> {comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {internalNotes.map((note, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={note.avatar} alt={note.user} />
                      <AvatarFallback>{note.user[0]}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`p-3 rounded-lg flex-grow ${
                        note.user === "Troy Paul"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">{note.user}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p>{note.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={addInternalNote}>Add Note</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {activityLog.map((activity, index) => {
                  const date = new Date(activity.timestamp);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  const dayOfWeek = date.toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  return (
                    <li key={index} className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-orange-500 z-10 mr-4 mt-1.5"></div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">{formattedDate}</span>
                          <br />
                          <span className="text-xs text-gray-400">
                            {dayOfWeek}
                          </span>
                          <br />
                          {activity.user}: {activity.action}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
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
                    <strong>Condition:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_New_or_Used ??
                        "Condition not available"
                      }
                      field="condition"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <Car className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Vehicle of Interest:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Brand ?? "Brand not available"
                      }
                      field="make"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <Car className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Model:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Model ?? "Model not available"
                      }
                      field="model"
                      section="deal"
                    />
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
                    <EditableField
                      value={
                        negotiation?.negotiations_Trim ?? "Trim not available"
                      }
                      field="trim"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <Car className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Drivetrain:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Drivetrain ??
                        "Drivetrain not available"
                      }
                      field="drivetrain"
                      section="deal"
                    />
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
                    <strong>Trade In:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Trade_Details ??
                        "Trade details not available"
                      }
                      field="tradeIn"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <DollarSign className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Finance Type:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_How_To_Pay ??
                        "No finance type"
                      }
                      field="financeType"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <DollarSign className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Budget:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Budget ??
                        "Negotiation budget not available"
                      }
                      field="budget"
                      section="deal"
                    />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[#202125]">
                  <DollarSign className="h-5 w-5 text-[#0989E5]" />
                  <span>
                    <strong>Monthly Budget:</strong>{" "}
                    <EditableField
                      value={
                        negotiation?.negotiations_Payment_Budget ??
                        "No monthly budget"
                      }
                      field="monthlyBudget"
                      section="deal"
                    />
                  </span>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    Features and Trim Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    {negotiation?.negotiations_Trim_Package_Options ??
                      "Trim details not available"}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Colors</h3>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      <strong>Desired Exterior:</strong>{" "}
                      {dealDetails.desiredColors.exterior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <ThumbsUp className="h-5 w-5 text-[#0989E5]" />
                    <span>
                      <strong>Desired Interior:</strong>{" "}
                      {dealDetails.desiredColors.interior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <X className="h-5 w-5 text-red-500" />
                    <span>
                      <strong>Exterior Deal Breakers:</strong>{" "}
                      {dealDetails.dealBreakers.exterior}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#202125]">
                    <X className="h-5 w-5 text-red-500" />
                    <span>
                      <strong>Interior Deal Breakers:</strong>{" "}
                      {dealDetails.dealBreakers.interior}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
