import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Pencil, Plus, Save, Upload, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import useTeamProfile from "@/hooks/useTeamProfile";
import Link from "next/link";
import { DealerData, IncomingBid } from "@/types";
import { TailwindPlusCard } from "../tailwind-plus/card";

type DeleteBidSectionProps = {
  setEditingBidId: (item: string | null) => void;
  editingBidId: string | null;
  handleSave: (item: string) => void;
  setOpenDialog: (item: string | null) => void;
  openDialog: string | null;
  handleEdit: (item: any) => void;
  handleDeleteFile: (fileToDelete: string, bidId: string) => void;
  handleBidFileUpload: (changeFiles: FileList | null, bidId: string) => void;
  setCommentingBidId: (item: string | null) => void;
  commentingBidId: string | null;
  setEditedBid: (item: {
    price: string;
    discountPrice: string;
    inventoryStatus: string;
    files: string[];
  }) => void;
  editedBid: {
    price: string;
    discountPrice: string;
    inventoryStatus: string;
    files: string[];
  };
  setNewComment: (item: { [key: string]: string }) => void;
  newComment: { [key: string]: string };
  addComment: (item: string) => void;
  incomingBids: IncomingBid[];
  dealers: DealerData[];
  negotiationId: string;
};

const DeleteBidSection = ({
  setEditingBidId,
  editingBidId,
  handleEdit,
  handleSave,
  setOpenDialog,
  openDialog,
  handleDeleteFile,
  setEditedBid,
  editedBid,
  handleBidFileUpload,
  setCommentingBidId,
  commentingBidId,
  setNewComment,
  newComment,
  addComment,
  incomingBids,
  dealers,
  negotiationId,
}: DeleteBidSectionProps) => {
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
  const { bidCommentsByBidId } = useTeamProfile({
    negotiationId: negotiationId ?? "",
  });
  // <FileText className="mr-2" />
  // Deleted Incoming Bids
  return (
    <TailwindPlusCard title="Deleted Incoming Bids" icon={FileText}>
      <div className="space-y-8">
        {incomingBids.length ? (
          incomingBids
            ?.filter((bid) => bid?.delete)

            .map((bidDetails, index) => {
              const matchingDealer = dealers.find(
                (dealer) => dealer.id === bidDetails.dealerId
              );

              return (
                <div
                  key={index}
                  className={`border-l-4 pl-4 pb-6 pt-2 pr-2 
                             ${
                               bidDetails.vote && bidDetails.vote === "like"
                                 ? "bg-green-100 border-green-600 "
                                 : bidDetails.vote === "dislike"
                                 ? "bg-orange-100 border-orange-600"
                                 : "bg-white border-blue-600"
                             }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-[#202125]">
                      {matchingDealer?.Dealership
                        ? `${matchingDealer.Dealership} Offer`
                        : "No Dealership"}
                    </h3>
                  </div>
                  <time className="block mb-2 text-sm text-[#202125]">
                    {formatDate(bidDetails?.timestamp)}
                  </time>
                  <p className="text-[#202125] mb-4">
                    Price: $
                    {bidDetails?.price
                      ? bidDetails?.price
                      : "No price available"}
                  </p>
                  <div className="flex space-x-2 mb-4">
                    <Dialog
                      open={openDialog === bidDetails.bid_id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen) {
                          setEditingBidId(null); // Reset editedBid when closing
                        }
                        setOpenDialog(isOpen ? bidDetails.bid_id ?? "" : null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View Offer
                        </Button>
                      </DialogTrigger>
                      <DialogContent style={{ background: "white" }}>
                        <div className="text-[#202125] space-y-4">
                          <div className="flex items-center gap-3">
                            <p className="text-2xl font-bold">
                              {matchingDealer?.Dealership} Detail
                            </p>
                            {editingBidId === bidDetails.bid_id ? (
                              <Button
                                size="sm"
                                onClick={() => handleSave(bidDetails.bid_id)}
                              >
                                <Save className="h-4 w-4 mr-2" /> Save
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(bidDetails)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Files Section */}
                          <div className="flex flex-wrap overflow-auto gap-4 mt-4">
                            {bidDetails.files.map((file, index) => {
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
                                  className="relative w-20 h-20 flex items-center justify-center rounded-md "
                                >
                                  <div className="absolute top-0 right-0 z-[99]">
                                    {editingBidId === bidDetails.bid_id && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent opening file when clicking the cross
                                          handleDeleteFile(
                                            file,
                                            bidDetails.bid_id
                                          );
                                        }}
                                        className="absolute top-0 right-0 bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </div>
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
                            {editingBidId === bidDetails.bid_id && (
                              <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-md cursor-pointer">
                                <label
                                  htmlFor="file-upload"
                                  className="text-center flex flex-col items-center text-gray-600"
                                >
                                  <input
                                    type="file"
                                    id="file-upload"
                                    onChange={(e) =>
                                      handleBidFileUpload(
                                        e.target.files,
                                        bidDetails.bid_id
                                      )
                                    }
                                    className="hidden"
                                    multiple
                                  />
                                  <Upload className="w-8 h-8 text-gray-600" />
                                  <p>Upload</p>
                                </label>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 mt-4">
                            <p className="font-semibold text-lg">
                              {matchingDealer?.SalesPersonName}
                            </p>
                            <p>
                              {matchingDealer?.City}
                              <br />
                              {matchingDealer?.State}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 rounded-full">
                              {editingBidId === bidDetails.bid_id ? (
                                <div className="space-x-2 flex">
                                  <label className="flex p-2 rounded-full bg-green-100 items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="inventoryStatus"
                                      value="In Stock"
                                      checked={
                                        editedBid.inventoryStatus === "In Stock"
                                      }
                                      onChange={() =>
                                        setEditedBid({
                                          ...editedBid,
                                          inventoryStatus: "In Stock",
                                        })
                                      }
                                      className="w-4 h-4"
                                    />
                                    <span>In Stock</span>
                                  </label>

                                  <label className="flex p-2 rounded-full bg-yellow-100 items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="inventoryStatus"
                                      value="In Transit"
                                      checked={
                                        editedBid.inventoryStatus ===
                                        "In Transit"
                                      }
                                      onChange={() =>
                                        setEditedBid({
                                          ...editedBid,
                                          inventoryStatus: "In Transit",
                                        })
                                      }
                                      className="w-4 h-4"
                                    />
                                    <span>In Transit</span>
                                  </label>
                                </div>
                              ) : (
                                <p
                                  className={`p-2 rounded-full ${
                                    bidDetails.inventoryStatus === "In Stock"
                                      ? "bg-green-100"
                                      : "bg-yellow-100"
                                  }`}
                                >
                                  {bidDetails?.inventoryStatus}
                                </p>
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between mt-4 border-t pt-4">
                            <div>
                              <p className="text-gray-500">Date Submitted</p>
                              <p>{formatDate(bidDetails.timestamp)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Price</p>
                              {editingBidId === bidDetails.bid_id ? (
                                <Input
                                  type="number"
                                  value={editedBid.price}
                                  onChange={(e) =>
                                    setEditedBid({
                                      ...editedBid,
                                      price: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <p className="text-2xl font-semibold">
                                  ${bidDetails.price}
                                </p>
                              )}
                              <p className="text-gray-500">
                                Total Discount: $
                                {editingBidId === bidDetails.bid_id ? (
                                  <Input
                                    type="number"
                                    value={editedBid.discountPrice}
                                    onChange={(e) =>
                                      setEditedBid({
                                        ...editedBid,
                                        discountPrice: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  bidDetails.discountPrice
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="border-t pt-4 flex justify-between">
                            <p className="font-semibold">Additional Comments</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCommentingBidId(
                          commentingBidId === bidDetails.bid_id
                            ? null
                            : bidDetails.bid_id
                        )
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Comment
                    </Button>
                  </div>
                  {commentingBidId === bidDetails.bid_id && (
                    <div className="mb-4">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment[bidDetails.bid_id] || ""}
                        onChange={(e) =>
                          setNewComment({
                            ...newComment,
                            [bidDetails.bid_id]: e.target.value,
                          })
                        }
                        className="mb-2"
                      />
                      <Button onClick={() => addComment(bidDetails.bid_id)}>
                        Submit Comment
                      </Button>
                    </div>
                  )}

                  {bidCommentsByBidId[bidDetails.bid_id] &&
                  bidCommentsByBidId[bidDetails.bid_id].length > 0 ? (
                    bidCommentsByBidId[bidDetails.bid_id].map(
                      (comment, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-100 rounded mt-1"
                        >
                          <p>
                            <strong>{comment.deal_coordinator_name}:</strong>{" "}
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
                  )}
                </div>
              );
            })
        ) : (
          <p>No incoming bids available</p>
        )}
      </div>
    </TailwindPlusCard>
  );
};

export default DeleteBidSection;
