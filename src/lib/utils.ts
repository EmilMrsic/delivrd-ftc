import { db } from "@/firebase/config";
import { Color, EditNegotiationData } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { collection, getDocs, query, where } from "firebase/firestore";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseColorOptions(colorOptions: string): {
  exteriorColors: Color[];
  interiorColors: Color[];
} {
  const exteriorSectionRegex = /Exterior\n([\s\S]*?)\n\s*Interior\n/;
  const interiorSectionRegex = /Interior\n([\s\S]*)\n/;

  const exteriorMatch = colorOptions.match(exteriorSectionRegex);
  const interiorMatch = colorOptions.match(interiorSectionRegex);

  function parseColors(section: string | null): Color[] {
    if (!section) return [];

    const unwantedCharRegex = /^[^\p{L}]+/u;

    return section
      .trim()
      .split("\n")
      .map((line) => {
        const isPreferred = line.startsWith("👍");
        // Remove any unwanted characters or emojis at the start
        const cleanedColorName = line.replace(unwantedCharRegex, "").trim();

        return {
          name: cleanedColorName,
          preferred: isPreferred,
        };
      })
      .filter((color) => color.name); // Filter out any empty color names
  }

  return {
    exteriorColors: exteriorMatch ? parseColors(exteriorMatch?.[1]) : [],
    interiorColors: interiorMatch ? parseColors(interiorMatch?.[1]) : [],
  };
}

export function formatDate(inputDate: string) {
  const date = new Date(inputDate);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

export const getElapsedTime = (startDate: string, endDate: Date) => {
  const start = new Date(startDate);
  const diffTime = Math.abs(endDate.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  }
};

export const dateFormat = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

export const getUser = async (id: string) => {
  const q = query(collection(db, "users"), where("id", "==", id));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const userData = querySnapshot.docs[0].data();
    return userData;
  }
};

export const mapNegotiationData = (data: any): EditNegotiationData => {
  return {
    id: data.id,
    clientInfo: {
      negotiations_Client: data.negotiations_Client || "",
      negotiations_First_Name: data.negotiations_First_Name || "",
      negotiations_Last_Name: data.negotiations_Last_Name || "",
      negotiations_Email: data.negotiations_Email || "",
      negotiations_Phone: data.negotiations_Phone || "",
      negotiations_Zip_Code: data.negotiations_Zip_Code || null,
      negotiations_city: data.negotiations_city || null,
      negotiations_state: data.negotiations_state || null,
      negotiations_deal_coordinator: data.negotiations_deal_coordinator,
    },
    dealInfo: {
      negotiations_Brand: data.negotiations_Brand || null,
      negotiations_Budget: data.negotiations_Budget || null,
      negotiations_Created: data.negotiations_Created || "",
      negotiations_Deal_Start_Date: data.negotiations_Deal_Start_Date || null,
      negotiations_Drivetrain: data.negotiations_Drivetrain || null,
      negotiations_Model: data.negotiations_Model || null,
      negotiations_How_To_Pay: data.negotiations_How_To_Pay || null,
      negotiations_Invoice_Link: data.negotiations_Invoice_Link || null,
      negotiations_Invoice_Status: data.negotiations_Invoice_Status || null,
      negotiations_Invoice_Status_Updates_Log:
        data.negotiations_Invoice_Status_Updates_Log || null,
      negotiations_New_or_Used: data.negotiations_New_or_Used || null,
      negotiations_Payment_Budget: data.negotiations_Payment_Budget || null,
      negotiations_Privilege_Level_From_Users:
        data.negotiations_Privilege_Level_From_Users || [],
      negotiations_Project_Short_Link:
        data.negotiations_Project_Short_Link || null,
      negotiations_Status: data.negotiations_Status || null,
      negotiations_Status_Updated: data.negotiations_Status_Updated || null,
      negotiations_Trade_Details: data.negotiations_Trade_Details || null,
      negotiations_Travel_Limit: data.negotiations_Travel_Limit || null,
      negotiations_Trim: data.negotiations_Trim || null,
      negotiations_Trim_Package_Options:
        data.negotiations_Trim_Package_Options || null,
    },
    otherData: {
      deals: data.deals || [],
      incoming_bids: data.incoming_bids,
      negotiations_Address: data.negotiations_Address || null,
      negotiations_Color_Options: data.negotiations_Color_Options || [],
    },
  };
};

export const dealStageOptions = [
  "Contacted",
  "Scheduled",
  "Proposal Sent",
  "Unqualified",
  "Lost",
  "No Show",
  "Paid",
  "Insta-Pay",
  "Paid Holding",
  "Deal Started",
  "Actively Negotiating",
  "Delivery Scheduled",
  "Long Term Order",
  "Shipping",
  "Tomi Needs To Review",
  "Ask for Review",
  "Client Nurture",
  "Follow Up",
  "Follow Up Issue",
  "Paid Lost Contact",
  "Refunded",
  "Canceled",
  "Client Delayed 1 Week",
  "Client Delayed 2 Weeks",
  "Client Delayed Other",
  "Ready & Confirmed",
  "Paid Need to finalize",
  "Manually Added",
  "Applicant",
];

export const vehicleOfInterest: string[] = [
  "Acura",
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Buck",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hummer",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

export const sendNotification = async (
  token: string,
  title: string,
  content: string,
  link: string
) => {
  const response = await fetch("/api/notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceToken: token,
      notification: {
        title,
        body: content,
      },
      data: {
        link,
      },
    }),
  });

  const result = await response.json();
  console.log(result);
  if (result.success) {
    console.log("Notification sent:", result.response);
  } else {
    console.error("Failed to send notification:", result.error);
  }
};

export function getCurrentTimestamp() {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = today.getFullYear();

  return `${month}/${day}/${year}`;
}

export async function getUsersWithTeamPrivilege() {
  try {
    const usersRef = collection(db, "users");

    const q = query(usersRef, where("privilege", "==", "Team"));

    const querySnapshot = await getDocs(q);

    const usersWithTeamPrivilege = querySnapshot.docs.map((doc) => doc.data());

    return usersWithTeamPrivilege;
  } catch (error) {
    console.error("Error getting users with 'Team' privilege:", error);
    throw error;
  }
}
