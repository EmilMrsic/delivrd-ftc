import { ClientDataType } from "@/lib/models/client";
import { ModalForm } from "../tailwind-plus/modal-form";
import { useMemo } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import { DealerDataType } from "@/lib/models/dealer";
import { generateRandomId } from "@/lib/utils";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { createNotification } from "@/lib/helpers/notifications";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/helpers/files";

export const DealerBidForm = ({
  vehicle,
  dealer,
  onClose,
  refetch,
}: {
  vehicle: ClientDataType & { bidNum: number; trade: boolean };
  dealer: DealerDataType;
  onClose: () => void;
  refetch: () => void;
}) => {
  const user = useLoggedInUser();
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
      inventoryStatus: values.inventoryStatus[0],
      manual_add: false,
      negotiationId: vehicle.negotiation_Id,
      price: values.price,
      bid_source: "FTC",
      source: "FTC",
      discountPrice: values.discountPrice,
      comments: values.comments,
      dealerId: dealer.id,
      dealerName: dealer.Dealership,
      dealerNumber: dealer.SalesPersonPhone,
      salesPersonName: dealer.SalesPersonName,
      salesPersonEmail: dealer.YourEmail,
      city: dealer.City,
      state: dealer.State,
      timestamp: Date.now(),
      timestamps: Date.now(),
      createdAt: Date.now().toString(),
    };

    const bidRef = doc(db, "Incoming Bids", bid_id);
    const negotiationSnapshot = await getDocs(
      query(
        collection(db, "delivrd_negotiations"),
        where("id", "==", vehicle.negotiation_Id)
      )
    );
    const negotiationRef = negotiationSnapshot.docs[0].ref;
    const negotiationData = negotiationSnapshot.docs[0].data();
    // const negotiation
    await setDoc(bidRef, bidObject);
    await updateDoc(negotiationRef, {
      incomingBids: arrayUnion(bid_id),
    });

    await createNotification(
      negotiationData.dealCoordinatorId,
      "new_dealer_bid",
      {
        bidId: bidObject.bid_id,
        negotiationId: negotiationData.id,
        author: user?.id,
      }
    );

    toast({
      title: "Bid submitted successfully",
      description: "The bid has been submitted to the negotiation",
    });
    refetch();
    onClose();
  };

  const fields = useMemo(() => {
    let fieldOutput: any = [
      {
        name: "alert",
        type: "infobox",
        props: {
          innerComponent: () => (
            <div className="max-w-[400px]">
              <strong className="font-semibold">Trim</strong>
              <br />
              {vehicle.Trim}
            </div>
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
