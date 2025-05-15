import { NextResponse } from "next/server";
import mailgun from "mailgun.js";
import formData from "form-data";
import { MAILGUN_API_KEY, MAILGUN_DOMAIN_NAME } from "@/lib/constants/keys";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { NegotiationDataType } from "@/lib/models/team";
import { IncomingBidType } from "@/lib/models/bids";

// NEXT_PUBLIC_MAILGUN_API_KEY

export const POST = async (req: Request) => {
  const mailGun = new mailgun(formData);
  const mg = mailGun.client({
    username: "api",
    key: MAILGUN_API_KEY,
  });

  const data = await req.json();
  const {
    price,
    discount,
    comments,
    dealerName,
    make,
    model,
    bidId,
    negotiationId,
  } = data;
  //   const negotiationTable = await collection(db, "delivrd_negotiations");
  //   const negotiation = await getDoc(doc(negotiationTable, negotiationId));
  //   const negotiationData = negotiation.data() as NegotiationDataType;

  const bidTable = await collection(db, "Incoming Bids");
  // reczNwbpN7EM48kagPs
  const bidSnapshot = await getDocs(
    query(
      bidTable,
      where("negotiationId", "==", negotiationId)
      //   where("delete", "in", [false, null])
    )
  );
  const bidData = bidSnapshot.docs.map((bid) => bid.data() as IncomingBidType);
  const bids = bidData.filter((bid) => {
    return bid.bid_id !== bidId && !bid.delete;
  });

  //   const bid = await getDoc(doc(bidTable, bidId));
  //   const bidData = bid.data() as IncomingBidType;
  //   console.log(data);
  const subject = `Update on Recent Bid - Outcome Notification`;

  const messagesToSend = bids.map((bid) => {
    // @ts-ignore
    const message = `Hi ${bid.dealerName || bid.dealer_name},
    
Thank you for submitting a bid for ${make} ${model} requested by a Delivrd client.

This deal has now been closed. Your bid was not selected, but here’s a summary of the winning offer:
Winning Price: $${price}
Discount Applied: $${discount}
Reason: ${comments || "N/A"}
Understanding what wins can help you improve future submissions. We appreciate your participation.

– The Delivrd Team
    `;

    // @ts-ignore
    return sendEmail(mg, message, [bid.salesPersonEmail], subject);
  });

  const responses = await Promise.all(messagesToSend);
  console.log("responses:", responses);
  return NextResponse.json({});
};

const sendEmail = (mg: any, message: string, to: string[], subject: string) => {
  return new Promise((resolve, reject) => {
    mg.messages.create(MAILGUN_DOMAIN_NAME, {
      from: "Delivrd <postmaster@delivrd.com>",
      to: to,
      subject: subject,
      text: message,
    });

    resolve(true);
  });
};
