"use client";
import BiddingSection from "@/components/base/bidding-section";
import { ModalForm } from "@/components/tailwind-plus/modal-form";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { negotiationMakeColors } from "@/lib/constants/negotiations";
import { DealerDataType } from "@/lib/models/dealer";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";

const BiddingPage = () => {
  const user = useLoggedInUser();
  const [dealer, setDealer] = useState<DealerDataType | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      (async () => {
        const dealerTable = collection(db, "Dealers");
        const q = query(dealerTable, where("id", "==", user.dealer_id[0]));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          setDealer(doc.data() as DealerDataType);
        });
      })();
    }
  }, [user]);

  useEffect(() => {
    if (dealer) {
      if (!dealer?.updated) {
        console.log("showing modal");
        document.body.style.overflow = "hidden";
        setShowModal(true);
      } else {
        document.body.style.overflow = "";
      }
    }
  }, [dealer]);

  const handleSubmit = async (values: DealerDataType) => {
    console.log("submitted:", dealer?.id);
    const dealerTable = collection(db, "Dealers");
    const docRef = doc(dealerTable, dealer?.id);
    await updateDoc(docRef, {
      ...values,
      radius: values?.radius?.[0],
      updated: true,
    });

    setDealer({
      ...dealer,
      ...values,
      radius: values?.radius?.[0],
      updated: true,
    });

    setShowModal(false);

    toast({
      title: "Information updated",
      description: "Your information has been updated",
    });
  };

  if (!dealer) return <></>;

  return (
    <>
      <BiddingSection />
      {showModal && (
        <ModalForm
          onClose={() => {}}
          title="Update Your First-to-Call Information"
          fields={[
            {
              name: "video",
              type: "video",
              props: {
                url: "https://www.loom.com/embed/357ba9d6b4e2474088b96e67bf4ab0f7?sid=de5aee96-42a4-43e1-8c89-6b0693b4732a", // https://www.loom.com/embed/97aab9ff5bc44633a6b9059235d588d0?sid=e8b6b1f5-f735-4958-bba9-a7618b9f629d",
              },
            },
            {
              name: "break",
              type: "break",
            },
            {
              name: "alert",
              type: "infobox",
              props: {
                innerComponent: () => (
                  <span className="whitespace-pre-wrap">
                    {" "}
                    <strong className="font-semibold">
                      Action Required:
                    </strong>{" "}
                    You must complete this information before you can submit
                    bids. This ensures we can notify you immediately when your
                    bid is accepted.
                  </span>
                ),
                icon: () => () =>
                  (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M12 6a9 9 0 100 18 9 9 0 000-18z"
                      />
                    </svg>
                  ),
              },
            },
            [
              {
                label: "First Name",
                name: "firstName",
                defaultValue: dealer.firstName || dealer.SalesPersonName,
                required: true,
              },
              {
                label: "Last Name",
                name: "lastName",
                defaultValue: dealer.lastName,
                required: true,
              },
            ],
            {
              label: "Dealership Name",
              name: "Dealership",
              defaultValue: dealer.Dealership,
              required: true,
            },
            [
              {
                label: "City",
                name: "City",
                defaultValue: dealer.City,
                required: true,
              },
              {
                label: "State",
                name: "State",
                defaultValue: dealer.State,
                required: true,
              },
            ],
            {
              label: "Dealership Website",
              name: "YourWebsite",
              defaultValue: dealer.YourWebsite,
              required: true,
            },
            {
              label: "Mobile Phone for SMS Alerts",
              name: "SalesPersonPhone",
              defaultValue: dealer.SalesPersonPhone,
              type: "phoneNumber",
              required: true,
            },
            {
              label: "Email Address",
              name: "YourEmail",
              defaultValue: dealer.YourEmail,
              required: true,
            },
            {
              label: "Brands you Represent",
              name: "Brand",
              type: "multiButtonSelect",
              options: Object.entries(negotiationMakeColors).map(([key]) => ({
                label: key,
                value: key,
              })),
              props: {
                multiple: true,
                checkboxes: true,
              },
              defaultValue: dealer.Brand,
              required: true,
            },
            {
              label: "Alert Radius",
              name: "radius",
              type: "multiButtonSelect",
              options: [
                {
                  label: "50 Miles",
                  value: "50",
                },
                {
                  label: "100 Miles",
                  value: "100",
                },
                {
                  label: "250 Miles",
                  value: "250",
                },
                {
                  label: "Nationwide",
                  value: "nationwide",
                },
              ],
              defaultValue: dealer.radius,
              infobox: {
                innerComponent: () => (
                  <span className="whitespace-pre-wrap">
                    <div>
                      <strong>
                        Be the first to know - get Instant SMS alerts!
                      </strong>
                    </div>
                    <div>
                      The moment a matching opportunity hits the Delivrd First
                      To Call List, you'll receive an immediate text alert --
                      giving you the competitive edge to place the first bid
                      before others see it
                    </div>
                  </span>
                ),
                color: "blue",
              },
              required: true,
            },
          ]}
          submitButtonLabel="Update Information"
          onSubmit={handleSubmit}
          height={100}
          width={30}
        />
      )}
    </>
  );
};

export default BiddingPage;
