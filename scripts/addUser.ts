import { config } from "dotenv";
config();
import { db } from "@/firebase/config";

import { addDoc, collection, doc, setDoc } from "firebase/firestore";

export const main = async () => {
  const userToAdd = {
    active_deals: [],
    brand: [],
    color_options: [],
    consult_date: [],
    dailyGoal: "2",
    deal_closed_date: [],
    deal_coordinator_id: "recCtAmzbrNiDgTle",
    deal_created_time: [],
    deal_negotiator: [],
    deal_started_date: [],
    dealer_id: [],
    drive_train: "\n",
    email: "dylanteam@thankyuu.com",
    id: "recSDPEYOzqGaKA25",
    invoice_status: [],
    is_onboarding_complete: [],
    mode: "reviewer",
    model: [],
    name: "Dylan Holland",
    negotiation_id: [],
    payment_type: [],
    phone: null,
    privilege: "Team",
    profile_pic: null,
    revenue: 0,
    role: [],
    source: "airtable",
    trade_details: [],
    trim_and_package_options: [],
    video_link: [],
    weeklyGoal: "5",
  };

  //   const userRef = collection(db, "users");
  //   await addDoc(userRef, userToAdd);

  const docRef = doc(db, "users", "recSDPEYOzqGaKA25");
  await setDoc(docRef, userToAdd);
};

main().then(() => {});
