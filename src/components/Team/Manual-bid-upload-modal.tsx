"use client";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import Select from "react-select";

import { UploadIcon } from "lucide-react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "@/firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, generateRandomId } from "@/lib/utils";
import { DealerData, EditNegotiationData, IncomingBid } from "@/types";
import { TailwindPlusButton } from "../tailwind-plus/button";
import { TailwindPlusInput } from "../tailwind-plus/input";
import { TailwindPlusTextarea } from "../tailwind-plus/textarea";
import { TailwindPlusDialogContent } from "../tailwind-plus/dialog";
import { NegotiationDataType } from "@/lib/models/team";
import { createNotification } from "@/lib/helpers/notifications";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";

interface FormData {
  dealerName: string;
  dealerNumber: string;
  salesPersonName: string;
  salesPersonEmail: string;
  city: string;
  state: string;
  priceExcludingTax: string;
  discountAmount: string;
  inventoryStatus: "In Stock" | "In Transit";
  additionalComments: string;
  files: File[] | null;
}

interface Errors {
  dealerName?: string;
  dealerNumber?: string;
  salesPersonEmail?: string;
  priceExcludingTax?: string;
  discountAmount?: string;
}

type ManualBidUploadType = {
  id: string | null;
  setStopPropagation?: (item: boolean) => void;
  dealers: DealerData[];
  setDealers?: (item: DealerData[]) => void;
  setIncomingBids: (item: IncomingBid[]) => void;
  incomingBids: IncomingBid[];
  negotiation: NegotiationDataType;
};

const ManualBidUpload = ({
  id,
  setStopPropagation,
  setDealers,
  dealers,
  incomingBids,
  setIncomingBids,
  negotiation,
}: ManualBidUploadType) => {
  const user = useLoggedInUser();
  const [formData, setFormData] = useState<FormData>({
    dealerName: "",
    dealerNumber: "",
    salesPersonName: "",
    salesPersonEmail: "",
    city: "",
    state: "",
    priceExcludingTax: "",
    discountAmount: "",
    inventoryStatus: "In Stock",
    additionalComments: "",
    files: null,
  });

  const { toast } = useToast();

  const [errors, setErrors] = useState<Errors>();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dealerships, setDealerships] = useState<any[]>([]);
  const [selectedDealership, setSelectedDealership] = useState<any>();

  const closeDialog = () => setIsDialogOpen(false);

  const [loader, setLoader] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if ((e.target as HTMLInputElement).files) {
      const files = (e.target as HTMLInputElement).files;

      if (files) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: Array.from(files),
        }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `uploads/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate Form Fields
    const requiredFields = {
      dealerName: "Dealer Name is required",
      dealerNumber: "Dealer Number is required",
      priceExcludingTax: "Price is required",
      discountAmount: "Discount Amount is required",
    };

    const formErrors: Errors = Object.entries(requiredFields).reduce(
      (errors: any, [key, message]) => {
        if (!formData[key as keyof typeof formData]) errors[key] = message;
        return errors;
      },
      {} as Errors
    );

    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      return;
    }

    setLoader(true);

    try {
      // Upload Files
      let fileUrls: string[] = [];
      if (formData.files?.length) {
        const fileArray = Array.from(formData.files);
        const uploadResults = await Promise.allSettled(
          fileArray.map(uploadFile)
        );
        fileUrls = uploadResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<string>).value);
      }

      // Generate Unique IDs
      const bid_id = generateRandomId();
      let dealerId = selectedDealership?.data?.id ?? generateRandomId();
      const dealerRef = doc(db, "Dealers", dealerId);
      let dealerData = selectedDealership?.data;
      // Create New Dealer Entry If Needed
      if (!selectedDealership?.data && !selectedDealership?.label) {
        const newDealer = {
          Brand: [""],
          Dealership: formData.dealerName,
          City: formData.city || "",
          Position: "",
          SalesPersonPhone: formData.dealerNumber,
          SalesPersonName: formData.salesPersonName || "",
          SalesPersonEmail: formData.salesPersonEmail || "",
          State: formData.state || "",
          YourEmail: "",
          YourWebsite: "",
          id: dealerId,
        };
        dealerData = newDealer;
        const dealerResponse = await setDoc(dealerRef, newDealer);

        setDealers && dealers && setDealers([...dealers, newDealer]);
      }

      console.log("dealerData", dealerId, selectedDealership);

      // Create Bid Data Object
      const bidData: any = {
        bid_id,
        negotiationId: id,
        dealerId,
        dealerName: formData.dealerName,
        dealerNumber: formData.dealerNumber,
        salesPersonName: formData.salesPersonName || "",
        salesPersonEmail: formData.salesPersonEmail || "",
        city: formData.city || "",
        state: formData.state || "",
        price: Number(formData.priceExcludingTax),
        discountPrice: Number(formData.discountAmount),
        inventoryStatus: formData.inventoryStatus,
        comments: formData.additionalComments || "",
        files: fileUrls,
        manual_add: true,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        bid_source: "Manual",
      };

      console.log("bidData", bidData);

      const bidRef = doc(db, "Incoming Bids", bid_id);

      await setDoc(bidRef, { ...bidData, bid_id });
      setIncomingBids &&
        incomingBids &&
        setIncomingBids([...incomingBids, bidData]);

      await updateDoc(doc(db, "delivrd_negotiations", id ?? ""), {
        incomingBids: arrayUnion(bid_id),
      });

      if (negotiation.dealCoordinatorId) {
        await createNotification(
          negotiation.dealCoordinatorId,
          "new_manual_bid",
          {
            bidId: bid_id,
            negotiationId: id,
            author: user.id,
          }
        );
      }

      resetForm();
      toast({ title: "Bid created successfully" });
      closeDialog();
    } catch (error) {
      console.error("Error uploading bid: ", error);
    } finally {
      setLoader(false);
    }
  };

  // Reset Form Function
  const resetForm = () => {
    setFormData({
      dealerName: "",
      dealerNumber: "",
      salesPersonName: "",
      city: "",
      state: "",
      priceExcludingTax: "",
      discountAmount: "",
      inventoryStatus: "In Stock",
      additionalComments: "",
      salesPersonEmail: "",
      files: null,
    });
  };

  useEffect(() => {
    const fetchDealerships = async () => {
      const dealershipRef = collection(db, "Dealers");
      const snapshot = await getDocs(dealershipRef);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDealerships(data);
    };

    if (isDialogOpen) {
      fetchDealerships();
    } else {
      setSelectedDealership("");
      // setFormData({
      //   dealerName: "",
      //   dealerNumber: "",
      //   salesPersonName: "",
      //   salesPersonEmail: "",
      //   city: "",
      //   state: "",
      //   priceExcludingTax: "",
      //   discountAmount: "",
      //   inventoryStatus: "In Stock",
      //   additionalComments: "",
      //   files: null,
      // });
    }
  }, [isDialogOpen]);

  const uniqueDealerships = Array.from(
    new Map(dealerships.map((d) => [d.Dealership, d])).values()
  );

  const dealershipOptions = uniqueDealerships.map((dealership) => ({
    value: dealership.Dealership,
    label: dealership.Dealership,
    data: dealership, // To access full dealership data on selection
  }));

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
      <>
        <DialogTrigger
          className={cn(
            "inline-flex items-center justify-center px-4 py-[calc(--spacing(2)-1px)]",
            "rounded-full border border-transparent bg-gray-950 shadow-md",
            "text-base font-medium whitespace-nowrap text-white",
            "data-disabled:bg-gray-950 data-disabled:opacity-40 data-hover:bg-gray-800"
          )}
          onClick={(e) => {
            e.stopPropagation();
            // setStopPropagation && setStopPropagation(true);
            // setIsDialogOpen(true);
            // console.log("clicked2:", isDialogOpen);
          }}
        >
          <TailwindPlusButton
            onClick={(e) => {
              e.stopPropagation();
              setStopPropagation && setStopPropagation(true);
              setIsDialogOpen(true);
            }}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            <p className="font-normal text-sm"> Manual Bids Upload</p>
          </TailwindPlusButton>
        </DialogTrigger>

        <TailwindPlusDialogContent
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="z-[9999]"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setStopPropagation && setStopPropagation(true);
            }}
            className="space-y-6"
          >
            <DialogTitle>
              <p className="text-2xl font-bold text-[#202125]">
                Manual Bid Upload
              </p>
            </DialogTitle>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStopPropagation && setStopPropagation(true);
              }}
              className="w-[310px]"
            >
              <label className="block text-sm font-medium">
                Select Dealership
              </label>
              <Select
                options={dealershipOptions}
                onChange={(selectedOption, a) => {
                  const selected = selectedOption?.data;
                  setSelectedDealership(selectedOption || "");
                  if (selected) {
                    setFormData((prev) => ({
                      ...prev,
                      dealerName: selected.Dealership || "",
                      dealerNumber: selected.SalesPersonPhone || "",
                      salesPersonName: selected.SalesPersonName || "",
                      salesPersonEmail: selected.YourEmail || "",
                      city: selected.City || "",
                      state: selected.State || "",
                    }));
                  }
                }}
                value={dealershipOptions.find(
                  (opt) => opt.value === selectedDealership
                )}
                placeholder="Search or Select Dealership"
                className="mt-1 w-full"
                isSearchable
                autoFocus={false}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Dealer Name *
                  </label>
                  <TailwindPlusInput
                    type="text"
                    name="dealerName"
                    value={formData.dealerName}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                  {errors?.dealerName && (
                    <span className="text-red-500 text-sm">
                      {errors.dealerName}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Dealer Number *
                  </label>
                  <TailwindPlusInput
                    type="text"
                    name="dealerNumber"
                    value={formData.dealerNumber}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                  {errors?.dealerNumber && (
                    <span className="text-red-500 text-sm">
                      {errors.dealerNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Sales Person Name
                  </label>
                  <TailwindPlusInput
                    type="text"
                    name="salesPersonName"
                    value={formData.salesPersonName}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Sales Person Email
                  </label>
                  <TailwindPlusInput
                    type="email"
                    name="salesPersonEmail"
                    value={formData.salesPersonEmail}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium">City</label>
                  <TailwindPlusInput
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">State</label>
                  <TailwindPlusInput
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium">
                  Price - Excluding Tax & Title *
                </label>
                <TailwindPlusInput
                  type="number"
                  placeholder="Enter Price"
                  name="priceExcludingTax"
                  value={formData.priceExcludingTax}
                  onChange={handleChange}
                  // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                />
                {errors?.priceExcludingTax && (
                  <span className="text-red-500 text-sm">
                    {errors.priceExcludingTax}
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Discount Amount *
                  </label>
                  <TailwindPlusInput
                    type="number"
                    placeholder="Enter Price"
                    name="discountAmount"
                    value={formData.discountAmount}
                    onChange={handleChange}
                    // className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                  {errors?.discountAmount && (
                    <span className="text-red-500 text-sm">
                      {errors.discountAmount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">
                  Inventory Status *
                </label>
                <div className="flex items-center space-x-4">
                  <div>
                    <input
                      type="radio"
                      name="inventoryStatus"
                      value="In Stock"
                      checked={formData.inventoryStatus === "In Stock"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>In Stock</label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      name="inventoryStatus"
                      value="In Transit"
                      checked={formData.inventoryStatus === "In Transit"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label>In Transit</label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium">
                  Additional Comments
                </label>
                <TailwindPlusTextarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setFormData((prev) => ({
                      ...prev,
                      additionalComments: e.target.value,
                    }));
                  }}
                  className="mt-1 resize-none p-2 w-full border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium">
                  Upload Files | T-Sheets & Window Stickers *
                </label>
                <input
                  type="file"
                  name="files"
                  onChange={handleChange}
                  multiple
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                />
              </div>

              <div className="mt-6">
                <button
                  disabled={loader}
                  type="submit"
                  className={`px-6 py-2 ${
                    !loader ? "bg-black text-white" : "bg-gray-500 text-black"
                  }  rounded-md w-full`}
                >
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        </TailwindPlusDialogContent>
      </>
    </Dialog>
  );
};

export default ManualBidUpload;
