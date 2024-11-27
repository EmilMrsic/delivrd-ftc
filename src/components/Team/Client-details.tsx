import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Mail, Phone, User } from "lucide-react";
import EditableInput from "../base/input-field";
import SearchableDropdown from "../base/searchable-dropdown";
import { Separator } from "@radix-ui/react-separator";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { DealNegotiator, EditNegotiationData } from "@/types";
import { dealStageOptions } from "@/lib/utils";

type ClientDetailsProps = {
  negotiation: EditNegotiationData | null;
  negotiationId: string | null;
  handleChange: (section: string, field: string, value: string) => void;
  dealNegotiator?: DealNegotiator;
};

const ClientDetails = ({
  negotiation,
  negotiationId,
  handleChange,
  dealNegotiator,
}: ClientDetailsProps) => {
  const isVimeoLink = (url: string): boolean => {
    return url.includes("vimeo.com");
  };
  const isYouTubeLink = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };
  return (
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
                <EditableInput
                  label="Phone"
                  value={negotiation?.clientInfo?.negotiations_Phone ?? ""}
                  userField="phone"
                  field="negotiations_Phone"
                  negotiationId={negotiationId ?? ""}
                  onChange={(newValue) =>
                    handleChange("clientInfo", "negotiations_Phone", newValue)
                  }
                />
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#202125]">
              <User className="h-5 w-5 text-[#0989E5]" />
              <span>
                <EditableInput
                  label="Name"
                  value={negotiation?.clientInfo?.negotiations_Client ?? ""}
                  userField="name"
                  field="negotiations_Client"
                  negotiationId={negotiationId ?? ""}
                  onChange={(newValue) =>
                    handleChange("clientInfo", "negotiations_Client", newValue)
                  }
                />
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#202125]">
              <Mail className="h-5 w-5 text-[#0989E5]" />
              <span>
                <EditableInput
                  label="Email"
                  userField="email"
                  field="negotiations_Email"
                  negotiationId={negotiationId ?? ""}
                  value={negotiation?.clientInfo?.negotiations_Email ?? ""}
                  onChange={(newValue) =>
                    handleChange("clientInfo", "negotiations_Email", newValue)
                  }
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
                <EditableInput
                  field="negotiations_Zip_Code"
                  negotiationId={negotiationId ?? ""}
                  label="Zip"
                  value={negotiation?.clientInfo?.negotiations_Zip_Code ?? ""}
                  onChange={(newValue) =>
                    handleChange(
                      "clientInfo",
                      "negotiations_Zip_Code",
                      newValue
                    )
                  }
                />
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#202125]">
              <FileText className="h-5 w-5 text-[#0989E5]" />
              <SearchableDropdown
                options={dealStageOptions}
                field="negotiations_Status"
                negotiationId={negotiationId ?? ""}
                label="Deal Stage"
                value={negotiation?.dealInfo?.negotiations_Status ?? ""}
              />
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
                <EditableInput
                  field="negotiations_city"
                  negotiationId={negotiationId ?? ""}
                  label="City"
                  value={negotiation?.clientInfo?.negotiations_city ?? ""}
                  onChange={(newValue) =>
                    handleChange("clientInfo", "negotiations_city", newValue)
                  }
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
                <EditableInput
                  field="negotiations_state"
                  negotiationId={negotiationId ?? ""}
                  label="State"
                  value={negotiation?.clientInfo?.negotiations_state ?? ""}
                  onChange={(newValue) =>
                    handleChange("clientInfo", "negotiations_state", newValue)
                  }
                />
              </span>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        {dealNegotiator ? (
          <div className="flex items-center space-x-4 mt-2">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={
                  dealNegotiator?.profile_pic ??
                  "/placeholder.svg?height=60&width=60"
                }
                alt="Staff"
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
                <p className="font-semibold">(386) 270-3530</p>
              </div>
            </div>
            <div className="flex space-x-2 ml-auto">
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
          </div>
        ) : (
          <p>No deal coordinator is assigned</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientDetails;
