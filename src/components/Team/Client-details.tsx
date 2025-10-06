import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Phone,
  User,
  User2,
} from "lucide-react";
import { InputField } from "../base/input-field";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { DealNegotiator } from "@/types";
import { cn } from "@/lib/utils";
import { TailwindPlusCard } from "../tailwind-plus/card";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusToggle } from "../tailwind-plus/toggle";
import {
  ArchivedStatuses,
  negotiationStatusOrder,
} from "@/lib/constants/negotiations";
import { DealNegotiatorDropdown } from "./deal-negotiator-dropdown";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { removeNegotiatorFromNegotiations } from "@/lib/helpers/negotiation";

type ClientDetailsProps = {
  negotiation: NegotiationDataType | null;
  negotiationId: string | null;
  handleChange: (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => void;
  dealNegotiator?: DealNegotiator;
  clientMode?: boolean;
  setClientMode: (clientMode: boolean) => void;
  allowClientModeToggle?: boolean;
  allDealNegotiator: DealNegotiatorType[];
};

const isVimeoLink = (url: string): boolean => {
  return url.includes("vimeo.com");
};

const isYouTubeLink = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

const ClientDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  dealNegotiator,
  clientMode,
  setClientMode,
  allowClientModeToggle,
  allDealNegotiator,
}: ClientDetailsProps) => {
  const [expandedAddress, setExpandedAddress] = useState(false);
  const [isBlur, setIsBlur] = useState(
    localStorage.getItem("streamMode") === "true"
  );

  const formatPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length > 7) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return val;
  };

  return (
    <TailwindPlusCard
      title="Client Overview"
      icon={User}
      actions={() => (
        <div className="flex items-center gap-2">
          {!clientMode && (
            <TailwindPlusToggle
              checked={isBlur}
              label="Stream mode"
              onToggle={(toggle) => {
                localStorage.setItem("streamMode", toggle.toString());
                setIsBlur(toggle);
              }}
            />
          )}
          {allowClientModeToggle && (
            <TailwindPlusToggle
              checked={clientMode}
              label="Client mode"
              onToggle={() => setClientMode(!clientMode)}
            />
          )}
        </div>
      )}
    >
      <div className={cn(`grid grid-cols-1 md:grid-cols-2 gap-4`)}>
        <div className="space-y-4">
          <div className={cn(`space-y-4`, isBlur && `blur-sm`)}>
            <InputField
              label="Phone"
              value={
                formatPhoneNumber(negotiation?.clientPhone ?? ("" as string)) ??
                ""
              }
              userField="phone"
              field="clientPhone"
              negotiationId={negotiationId ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "clientPhone",
                  newValue: formatPhoneNumber(newValue),
                })
              }
              icon={Phone}
              readOnly={clientMode}
            />
            <InputField
              label="Prefix"
              value={negotiation?.prefix ?? ""}
              firstName={negotiation?.prefix}
              lastName={negotiation?.prefix}
              field="prefix"
              negotiationId={negotiationId ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "prefix",
                  newValue: newValue,
                })
              }
              icon={User}
              readOnly={clientMode}
            />
            <InputField
              label="First Name"
              value={negotiation?.clientFirstName ?? ""}
              userField="firstName"
              firstName={negotiation?.clientFirstName}
              lastName={negotiation?.clientLastName}
              field="clientFirstName"
              negotiationId={negotiationId ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "clientFirstName",
                  newValue: newValue,
                })
              }
              icon={User}
              readOnly={clientMode}
            />
            <InputField
              label="Last Name"
              firstName={negotiation?.clientFirstName}
              lastName={negotiation?.clientLastName}
              value={negotiation?.clientLastName ?? ""}
              userField="lastName"
              field="clientLastName"
              negotiationId={negotiationId ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "clientLastName",
                  newValue: newValue,
                })
              }
              icon={User}
              readOnly={clientMode}
            />
            <InputField
              label="Email"
              userField="email"
              field="clientEmail"
              negotiationId={negotiationId ?? ""}
              value={negotiation?.clientEmail ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "clientEmail",
                  newValue: newValue,
                })
              }
              icon={Mail}
              readOnly={clientMode}
            />
          </div>
          {negotiation?.dealCoordinatorId && dealNegotiator ? (
            <CoordinatorDetails
              dealNegotiator={dealNegotiator as unknown as DealNegotiatorType}
              isBlur={isBlur}
            />
          ) : (
            <p>No deal coordinator is assigned</p>
          )}
        </div>
        <div className="space-y-4">
          <div className={cn(`space-y-4`, isBlur && `blur-sm`)}>
            <InputField
              type="searchableDropdown"
              tableOverride={
                ArchivedStatuses.includes(negotiation?.stage as string)
                  ? "delivrd_archive"
                  : undefined
              }
              options={[
                ...negotiationStatusOrder,
                "Refunded",
                "Scheduled",
                "Proposal Sent",
              ]}
              field="stage"
              negotiationId={negotiationId ?? ""}
              label="Deal Stage"
              value={negotiation?.stage ?? ""}
              icon={FileText}
              readOnly={clientMode}
            />
            <InputField
              field="address"
              negotiationId={negotiationId ?? ""}
              label="Address"
              value={`${negotiation?.address}, ${negotiation?.city}, ${negotiation?.state} ${negotiation?.zip}`}
              disabled={true}
              // onChange={(newValue) =>
              //   handleChange({
              //     key: "address",
              //     newValue: newValue,
              //   })
              // }
              icon={() => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              readOnly={clientMode}
            />
            <div className="flex justify-between mb-0">
              <div className="flex items-center gap-2 font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Address Details
              </div>
              <div
                className="cursor-pointer"
                onClick={() => {
                  setExpandedAddress(!expandedAddress);
                }}
              >
                {expandedAddress ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            {expandedAddress && (
              <div className="w-full">
                <InputField
                  field="address"
                  negotiationId={negotiationId ?? ""}
                  label="Street Address"
                  value={negotiation?.address ?? ""}
                  onChange={(newValue) =>
                    handleChange({
                      key: "address",
                      newValue: newValue,
                    })
                  }
                  readOnly={clientMode}
                />
                <div className="flex justify-between">
                  <InputField
                    field="city"
                    negotiationId={negotiationId ?? ""}
                    label="City"
                    value={negotiation?.city ?? ""}
                    onChange={(newValue) =>
                      handleChange({
                        key: "city",
                        newValue: newValue,
                      })
                    }
                    readOnly={clientMode}
                  />
                  <InputField
                    field="state"
                    negotiationId={negotiationId ?? ""}
                    label="State"
                    value={negotiation?.state ?? ""}
                    onChange={(newValue) =>
                      handleChange({
                        key: "state",
                        newValue: newValue,
                      })
                    }
                    readOnly={clientMode}
                  />
                </div>
                <InputField
                  field="zip"
                  negotiationId={negotiationId ?? ""}
                  label="Zip"
                  value={negotiation?.zip ?? ""}
                  onChange={(newValue) =>
                    handleChange({
                      key: "zip",
                      newValue: newValue,
                    })
                  }
                  readOnly={clientMode}
                />
              </div>
            )}
            {!clientMode && (
              <InputField
                field="dealCoordinatorId"
                negotiationId={negotiationId ?? ""}
                label="Deal Negotiator"
                value={negotiation?.dealCoordinatorId}
                onChange={(newValue) => {}}
                icon={User2}
                as={() => (
                  <DealNegotiatorDropdown
                    deal={negotiation as NegotiationDataType}
                    allDealNegotiator={allDealNegotiator}
                    updateDealNegotiator={async (id, negotiatorId) => {
                      const negotiationRef = doc(
                        db,
                        "delivrd_negotiations",
                        negotiationId ?? ""
                      );
                      await updateDoc(negotiationRef, {
                        dealCoordinatorId: negotiatorId,
                      });

                      handleChange({
                        key: "dealCoordinatorId",
                        newValue: negotiatorId,
                      });
                    }}
                    onRemoveNegotiator={async (id) => {
                      removeNegotiatorFromNegotiations(id);
                      handleChange({
                        key: "dealCoordinatorId",
                        newValue: "",
                      });
                    }}
                  />
                )}
              />
            )}
          </div>
          {negotiation?.dealCoordinatorId && dealNegotiator && (
            <CoordinatorVideo
              dealNegotiator={dealNegotiator as unknown as DealNegotiatorType}
            />
          )}
        </div>
      </div>
      {negotiation && <SupportAgents negotiation={negotiation} />}
    </TailwindPlusCard>
  );
};

export const SupportAgents = ({
  dealNegotiator,
  negotiation,
}: {
  dealNegotiator?: DealNegotiatorType;
  negotiation?: NegotiationDataType;
}) => {
  if (!negotiation) return null;

  return (
    <div className="mt-4">
      {negotiation.dealCoordinatorId !== "recos5ry1A7L7rFo7" && (
        <>
          <hr />
          <div className="text-2xl mt-4">Final Review and Deal Approver</div>
          <div className={cn(`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4`)}>
            <div className="space-y-4">
              <span className="text-sm">
                Tomi reviews and approves every deal before your Deal
                Coordinator presents the deal.
              </span>
              <CoordinatorDetails
                dealNegotiator={
                  {
                    name: "Tomislav Mikula",
                    role: "Founder",
                    profile_pic:
                      "https://firebasestorage.googleapis.com/v0/b/delivrd-first-to-call-bids.appspot.com/o/profile_pic%2FTomi%20Icon%20Image%20(2).png?alt=media&token=99586261-fd6e-4b5b-83c1-65ae79f6db23",
                  } as DealNegotiatorType
                }
                isBlur={false}
              />
            </div>
            <div className="space-y-4">
              <CoordinatorVideo
                dealNegotiator={
                  {
                    video_link:
                      "https://vimeo.com/937785873/5766f39363?share=copy",
                  } as DealNegotiatorType
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const CoordinatorDetails = ({
  dealNegotiator,
  isBlur,
}: {
  dealNegotiator: DealNegotiatorType;
  isBlur: boolean;
}) => {
  return (
    <div className="flex items-center space-x-4 w-full">
      <Avatar className="h-16 w-16">
        <AvatarImage
          src={
            dealNegotiator?.profile_pic ?? "/placeholder.svg?height=60&width=60"
          }
          alt="Staff"
          className="rounded-full"
        />
        <AvatarFallback>
          {dealNegotiator?.name.split(" ")[0] ??
            "" + dealNegotiator?.name.split(" ")[1] ??
            ""}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-semibold text-lg text-[#202125]">
          {dealNegotiator?.name ?? ""}
        </div>
        <div className="text-[#202125]">{dealNegotiator?.role ?? ""}</div>
        <div className="mt-1 text-sm text-[#202125]">
          <p>Contact Delivrd (text messages preferred)</p>
          <p className={cn(`font-semibold`, isBlur && `blur-sm`)}>
            (386) 270-3530
          </p>
        </div>
      </div>
    </div>
  );
};

export const CoordinatorVideo = ({
  dealNegotiator,
}: {
  dealNegotiator: DealNegotiatorType;
}) => {
  return (
    <div className="flex space-x-2 ml-auto mt-[20px]">
      <>
        {dealNegotiator?.video_link && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative w-full h-[320px]">
                {isVimeoLink(dealNegotiator?.video_link ?? "") ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${
                      dealNegotiator?.video_link.split("/")[3]
                    }`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                  />
                ) : isYouTubeLink(dealNegotiator?.video_link) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      dealNegotiator?.video_link.split("v=")[1]?.split("&")[0]
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
  );
};

export default ClientDetails;
