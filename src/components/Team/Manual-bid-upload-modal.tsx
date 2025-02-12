"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { UploadIcon } from "lucide-react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "@/firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateRandomId } from "@/lib/utils";
import { EditNegotiationData } from "@/types";

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

const ManualBidUpload = ({ id }: { id: string | null }) => {
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
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `uploads/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("File available at:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let formErrors: Errors = {};

    if (!formData.dealerName) formErrors.dealerName = "Dealer Name is required";
    if (!formData.dealerNumber)
      formErrors.dealerNumber = "Dealer Number is required";
    if (!formData.priceExcludingTax)
      formErrors.priceExcludingTax = "Price is required";
    if (!formData.discountAmount)
      formErrors.discountAmount = "Discount Amount is required";
    if (!formData.salesPersonEmail) {
      formErrors.salesPersonEmail = "Salesperson Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.salesPersonEmail)) {
      formErrors.salesPersonEmail = "Invalid email format";
    }

    setErrors(formErrors);

    setLoader(true);

    let fileUrls: string[] = [];

    if (formData.files && formData.files.length > 0) {
      const fileArray = Array.from(formData.files);
      const uploadPromises = fileArray.map((file) => uploadFile(file));
      fileUrls = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as string[];
    }
    const bid_id = generateRandomId();
    const bidData = {
      bid_id,
      negotiationId: id,
      clientId: "N/A",
      dealerId: "N/A",
      dealerName: formData.dealerName,
      dealerNumber: formData.dealerNumber,
      salesPersonName: formData.salesPersonName ?? "",
      salesPersonEmail: formData.salesPersonEmail ?? "",
      city: formData.city ?? "",
      state: formData.state ?? "",
      price: Number(formData.priceExcludingTax),
      discountPrice: Number(formData.discountAmount),
      inventoryStatus: formData.inventoryStatus,
      comments: formData.additionalComments ?? "",
      files: fileUrls ?? [],
      manual_add: true,
      timestamps: new Date(),
      source: "firebase",
    };

    try {
      const bidRef = collection(db, "manual bids");
      await addDoc(bidRef, bidData);
      const negotiationRef = doc(db, "negotiations", id ?? "");
      await updateDoc(negotiationRef, {
        incoming_bids: arrayUnion(bid_id),
      });
      setLoader(false);
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
      toast({ title: "Bid created successfully" });
      closeDialog();
      window.location.reload();
    } catch (error) {
      console.error("Error uploading bid: ", error);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <>
        <DialogTrigger className="bg-white text-black rounded-lg flex items-center p-2">
          <UploadIcon className="mr-2 h-4 w-4" />
          <p className="font-normal text-sm"> Manual Bids Upload</p>
        </DialogTrigger>

        <DialogContent className="p-8 bg-white rounded-lg max-w-[700px] mx-auto shadow-xl h-[95%] overflow-scroll">
          <div className="space-y-6">
            <DialogTitle>
              <p className="text-2xl font-bold text-[#202125]">
                Manual Bid Upload
              </p>
            </DialogTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Dealer Name *
                  </label>
                  <input
                    type="text"
                    name="dealerName"
                    value={formData.dealerName}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
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
                  <input
                    type="text"
                    name="dealerNumber"
                    value={formData.dealerNumber}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
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
                  <input
                    type="text"
                    name="salesPersonName"
                    value={formData.salesPersonName}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Sales Person Email
                  </label>
                  <input
                    type="email"
                    name="salesPersonEmail"
                    value={formData.salesPersonEmail}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium">
                  Price - Excluding Tax & Title *
                </label>
                <input
                  type="number"
                  placeholder="Enter Price"
                  name="priceExcludingTax"
                  value={formData.priceExcludingTax}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md"
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
                  <input
                    type="number"
                    placeholder="Enter Price"
                    name="discountAmount"
                    value={formData.discountAmount}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
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
                <textarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
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
        </DialogContent>
      </>
    </Dialog>
  );
};

export default ManualBidUpload;
