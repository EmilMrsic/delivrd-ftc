import { ClientDataType } from "@/lib/models/client";
import { ModalForm } from "../tailwind-plus/modal-form";
import { useMemo } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import { DealerDataType } from "@/lib/models/dealer";
import { generateRandomId } from "@/lib/utils";
import { doc, setDoc } from "firebase/firestore";

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

export const DealerBidForm = ({
  vehicle,
  dealer,
  onClose,
}: {
  vehicle: ClientDataType & { bidNum: number; trade: boolean };
  dealer: DealerDataType;
  onClose: () => void;
}) => {
  const handleSubmit = async (values: any) => {
    let fileUrls: string[] = [];
    if (values.files?.length) {
      const fileArray = Array.from(values.files);
      // @ts-ignore
      const uploadResults = await Promise.allSettled(fileArray.map(uploadFile));
      fileUrls = uploadResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<string>).value);
    }

    const bid_id = generateRandomId();

    const bidObject = {
      id: bid_id,
      bid_id: bid_id,
      clientId: vehicle.id,
      files: fileUrls,
      inventoryStatus: values.inventoryStatus,
      manual_add: true,
      negotiationId: vehicle.negotiation_Id,
      price: values.price,
      discountAmount: values.discountPrice,
      comments: values.comments,
      dealerId: dealer.id,
      dealerName: dealer.Dealership,
      dealerNumber: dealer.SalesPersonPhone,
      salesPersonName: dealer.SalesPersonName,
      salesPersonEmail: dealer.YourEmail,
      city: dealer.City,
      state: dealer.State,
    };

    const bidRef = doc(db, "Incoming Bids", bid_id);
    await setDoc(bidRef, bidObject);
    onClose();
  };

  const fields = useMemo(() => {
    let fieldOutput: any = [
      {
        name: "alert",
        type: "infobox",
        props: {
          innerComponent: () => (
            <span className="whitespace-pre-wrap">
              <strong className="font-semibold">Trim</strong>
              <br />
              {vehicle.Trim}
            </span>
          ),
          color: "blue",
        },
      },
    ];

    if (vehicle.desiredExterior || vehicle.excludedExterior) {
      fieldOutput.push({
        name: "exteriorColors",
        type: "colorDisplayCard",
        props: {
          desired: vehicle.desiredExterior,
          excluded: vehicle.excludedExterior,
          title: "Exterior Colors",
        },
      });
    }

    if (vehicle.desiredInterior || vehicle.excludedInterior) {
      fieldOutput.push({
        name: "interiorColors",
        type: "colorDisplayCard",
        props: {
          desired: vehicle.desiredInterior,
          excluded: vehicle.excludedInterior,
          title: "Interior Colors",
        },
      });
    }

    fieldOutput.push({
      name: "trim",
      type: "trimDisplayCard",
      props: {
        trim: vehicle.Trim || "No Preference",
      },
    });

    // {
    //   name: "exteriorColors",
    //   type: "colorDisplayCard",
    //   props: {},
    // }

    fieldOutput = [
      ...fieldOutput,
      {
        type: "break",
        name: "break1",
      },
      {
        label: "Selling Price - Excluding Tax & Title",
        name: "price",
        required: true,
      },
      {
        label: "Discount Amount",
        name: "discountPrice",
        required: true,
      },
      {
        type: "break",
        name: "break1",
      },
      {
        label: "Inventory Status",
        name: "inventoryStatus",
        required: true,
        type: "multiButtonSelect",
        options: [
          { label: "In Stock", value: "In Stock" },
          { label: "In Transit", value: "In Transit" },
          { label: "Out of Stock", value: "Out of Stock" },
        ],
        defaultValue: "In Stock",
        props: {
          checkboxes: true,
          asRadio: true,
        },
      },
      {
        label: "Additional Comments",
        name: "comments",
        type: "textarea",
      },
      {
        label: "Upload Files",
        name: "files",
        type: "files",
        defaultValue: [],
      },
    ];

    return fieldOutput;
  }, [vehicle]);

  return (
    <ModalForm
      title={`${vehicle.Brand} ${vehicle.Model}`}
      height={100}
      fields={fields}
      submitButtonLabel="Submit"
      onSubmit={handleSubmit}
      onClose={() => {
        onClose();
      }}
    />
  );
};
