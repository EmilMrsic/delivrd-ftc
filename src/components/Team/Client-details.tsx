import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Mail, Phone, User } from "lucide-react";
import EditableInput, { InputField } from "../base/input-field";
import SearchableDropdown from "../base/searchable-dropdown";
import { Separator } from "@radix-ui/react-separator";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { DealNegotiator, EditNegotiationData } from "@/types";
import { cn, dealStageOptions } from "@/lib/utils";
import { TailwindPlusCard } from "../tailwind-plus/card";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusToggle } from "../tailwind-plus/toggle";
import { negotiationStatusOrder } from "@/lib/constants/negotiations";

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
};

const ClientDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  dealNegotiator,
  clientMode,
}: ClientDetailsProps) => {
  const [isBlur, setIsBlur] = useState(
    localStorage.getItem("streamMode") === "true"
  );
  const isVimeoLink = (url: string): boolean => {
    return url.includes("vimeo.com");
  };

  const formatPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length > 7) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return val;
  };

  const isYouTubeLink = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  return (
    <TailwindPlusCard
      title="Client Overview"
      icon={User}
      actions={() =>
        !clientMode && (
          <TailwindPlusToggle
            checked={isBlur}
            label="Stream mode"
            onToggle={(toggle) => {
              localStorage.setItem("streamMode", toggle.toString());
              setIsBlur(toggle);
            }}
          />
        )
      }
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
              firstName={negotiation?.clientLastName}
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
              icon={() => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              readOnly={clientMode}
            />
          </div>
          {dealNegotiator ? (
            <div className="flex items-center space-x-4 w-full">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={
                    dealNegotiator?.profile_pic ??
                    "/placeholder.svg?height=60&width=60"
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
                <div className="text-[#202125]">
                  {dealNegotiator?.role ?? ""}
                </div>
                <div className="mt-1 text-sm text-[#202125]">
                  <p>Contact Delivrd (text messages preferred)</p>
                  <p className={cn(`font-semibold`, isBlur && `blur-sm`)}>
                    (386) 270-3530
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p>No deal coordinator is assigned</p>
          )}
        </div>
        <div className="space-y-4">
          <div className={cn(`space-y-4`, isBlur && `blur-sm`)}>
            <InputField
              type="searchableDropdown"
              options={negotiationStatusOrder}
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
              value={negotiation?.address ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "address",
                  newValue: newValue,
                })
              }
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
            <InputField
              field="city_state"
              negotiationId={negotiationId ?? ""}
              label="City/State"
              value={negotiation?.city_state ?? ""}
              onChange={(newValue) =>
                handleChange({
                  key: "city_state",
                  newValue: newValue,
                })
              }
              icon={() => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              readOnly={clientMode}
            />
          </div>
          {dealNegotiator && (
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
                              dealNegotiator?.video_link
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
          )}
        </div>
      </div>
    </TailwindPlusCard>
  );
};

export default ClientDetails;
