import { db, storage } from "@/firebase/config";
import {
  Color,
  EditNegotiationData,
  IncomingBid,
  NegotiationData,
} from "@/types";
import { clsx, type ClassValue } from "clsx";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { twMerge } from "tailwind-merge";
import { dateFormat } from "./helpers/dates";
import { statusColors } from "./constants/negotiations";

export { dateFormat };

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

export const getElapsedTime = (
  startDate: string,
  endDate: Date = new Date()
): string => {
  const start = new Date(startDate);
  const diffTime = endDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays <= 6) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
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
      arrival_to_client: data.arrival_to_client ?? "",
      arrival_to_dealer: data.arrival_to_dealer ?? "",
      date_paid: data.date_paid ?? "",
      close_date: data.close_date ?? "",
      prefix: data.prefix ?? "",
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
      shipping_info:
        data.shipping_info ?? "No Shipping Info available at the moment",
      trade_in_comments: data.trade_in_comments,
      trade_in_files: data.trade_in_files,
      trade_in_vin: data.trade_in_vin,
      trade_in_mileage: data.trade_in_mileage,
    },
    otherData: {
      deals: data.deals || [],
      incoming_bids: data.incoming_bids,
      negotiations_Address: data.negotiations_Address || null,
      negotiations_Color_Options: data.negotiations_Color_Options,
    },
  };
};

export const dealStageOptions = [
  "Not Closed",
  "Not Closed ALL",
  "Paid/Unassigned",
  "Contacted",
  "Closed",
  "Scheduled",
  "Proposal Sent",
  "Unqualified",
  "Lost",
  "No Show",
  "Paid",
  "Insta Pay",
  "Paid Holding",
  "Deal Started",
  "Deal Complete- Long Distance",
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
  "Needs To Review",
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
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return `${month}/${day}/${year}`;
}

export const getCurrentDateTime = (): string => {
  const now = new Date();
  const date = now.toLocaleDateString("en-US"); // Format like 2/4/2025
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
};

const statusArray = [
  "Sent",
  "24hr Reminder",
  "48hr Reminder",
  "72hr Reminder",
  "6 Day Reminder",
  "PAID",
  "Unpaid/No Response",
  "Unpaid-Pending",
];

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

export const fetchActiveDeals = async (id: string) => {
  try {
    const teamDocRef = doc(db, "team delivrd", id);
    const teamSnapshot = await getDoc(teamDocRef);

    if (!teamSnapshot.exists()) {
      console.log("Team document not found");
      return [];
    }

    const teamData = teamSnapshot.data();

    const activeDeals = teamData.active_deals;

    if (!Array.isArray(activeDeals) || activeDeals.length === 0) {
      console.log("No active deals found");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedDeals = chunk(activeDeals, 30);
    let allNegotiations: any = [];

    for (const chunk of chunkedDeals) {
      const negotiationsQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const negotiationsSnapshot = await getDocs(negotiationsQuery);
      const negotiationsData = negotiationsSnapshot.docs.map((doc) =>
        doc.data()
      );
      allNegotiations = [...allNegotiations, ...negotiationsData];
    }

    return allNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations:", error);
    return [];
  }
};

export const fetchAllPaidNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_Status", "==", "Paid")
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const paidNegotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (paidNegotiationIds.length === 0) {
      console.log("No negotiations with status PAID found.");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunk(paidNegotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((doc) => !doc.hasOwnProperty("negotiations_deal_coordinator"));

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};

export const fetchAllProposalSendNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_Status", "==", "Proposal Sent")
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const paidNegotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (paidNegotiationIds.length === 0) {
      console.log("No negotiations with status PAID found.");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunk(paidNegotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (doc: any) =>
            doc.negotiations_Invoice_Status !== null &&
            statusArray.includes(doc.negotiations_Invoice_Status.trim())
        );

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};

export const allowedStatuses = [
  "Deal Started",
  "Actively Negotiating",
  "Delivery Scheduled",
  "Deal Complete- Long Distance",
  "Long Term Order",
  "Shipping",
  "Needs To Review",
  "Follow Up",
  "Follow Up Issue",
];

export const fetchAllActiveNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_Status", "in", [
        "Actively Negotiating",
        "Deal Started",
        "Paid",
      ])
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const paidNegotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (paidNegotiationIds.length === 0) {
      console.log("No negotiations with status PAID found.");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunk(paidNegotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};

export const fetchAllPaidHoldingNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_Status", "==", "Paid Holding")
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const paidNegotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (paidNegotiationIds.length === 0) {
      console.log("No negotiations with status PAID found.");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunk(paidNegotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};
export const fetchAllOldNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_Status", "in", [
        "Actively Negotiating",
        "Deal Started",
        "Paid",
      ])
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const paidNegotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (paidNegotiationIds.length === 0) {
      console.log("No negotiations with status PAID found.");
      return [];
    }

    const chunk = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunk(paidNegotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};

export const fetchAllNotClosedNegotiations = async () => {
  try {
    const negotiationsQuery = query(
      collection(db, "negotiations"),
      where("negotiations_deal_coordinator", "!=", "")
    );

    const negotiationsSnapshot = await getDocs(negotiationsQuery);
    const negotiationIds = negotiationsSnapshot.docs.map((doc) => doc.id);

    if (negotiationIds.length === 0) {
      console.log("No active negotiations found.");
      return [];
    }

    // Function to split an array into chunks
    const chunkArray = (array: string[], size: number) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const chunkedIds = chunkArray(negotiationIds, 30);
    let allFilteredNegotiations: any[] = [];

    for (const chunk of chunkedIds) {
      const batchQuery = query(
        collection(db, "negotiations"),
        where("__name__", "in", chunk)
      );

      const batchSnapshot = await getDocs(batchQuery);
      const filteredData = batchSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item: any) =>
          allowedStatuses.includes(item.negotiations_Status.trim())
        );

      allFilteredNegotiations = [...allFilteredNegotiations, ...filteredData];
    }

    console.log("Filtered Negotiations:", allFilteredNegotiations);
    return allFilteredNegotiations;
  } catch (error) {
    console.error("Error fetching negotiations in batches:", error);
    return [];
  }
};

export function generateRandomId(prefix = "rec", length = 16) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return prefix + randomPart;
}

export const updateBidInFirebase = async (
  bidId: string,
  updatedFields: Partial<IncomingBid>
) => {
  if (!bidId) return;

  try {
    const bid_id = bidId;
    const bidRef = doc(db, "Incoming Bids", bid_id);
    await updateDoc(bidRef, updatedFields);
    console.log("Bid updated successfully!");
  } catch (error) {
    console.error("Error updating bid:", error);
  }
};

export const uploadFile = async (file: File): Promise<string | null> => {
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

export const getDealsWithoutCoordinator = async () => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, "negotiations"),
        where("negotiations_Status", "in", [
          "Actively Negotiating",
          "Paid",
          "Deal Started",
        ])
      )
    );

    return querySnapshot.docs.reduce((deals: any[], doc) => {
      const data = doc.data();
      if (!data.negotiations_deal_coordinator) {
        deals.push({ id: doc.id, ...data });
      }
      return deals;
    }, []);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
};

export const getReviewDealsWithoutCoordinator = async () => {
  const dealsQuery = query(
    collection(db, "negotiations"),
    where("negotiations_Status", "==", "Needs To Review")
  );

  try {
    const querySnapshot = await getDocs(dealsQuery);
    const deals: any = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((deal: any) => !deal.negotiations_deal_coordinator); // Filter null or empty values manually

    console.log(deals);
    return deals;
  } catch (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
};

export const getStatusStyles = (status: string) => {
  const backgroundColor = statusColors[status] || "#E5E7EB"; // Default gray
  const isDark = isDarkColor(backgroundColor);
  const textColor = isDark ? "#FFFFFF" : "#000000"; // White for dark, black for light

  return { backgroundColor, textColor };
};

// Function to check if a color is dark
export const isDarkColor = (hex: string) => {
  // Convert hex to RGB
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5; // Dark if luminance is low
};

export const getActivityLogsByNegotiationId = async (negotiationId: string) => {
  try {
    const id = negotiationId;
    const logsRef = collection(db, "activity log");

    const q = query(logsRef, where("negotiationId", "==", id));

    // Get the query snapshot
    const querySnapshot = await getDocs(q);

    // Extract the documents (activity logs) from the snapshot
    const activityLogs = querySnapshot.docs.map((doc) => doc.data());

    if (activityLogs.length > 0) {
      console.log("Found Activity Logs:", activityLogs);
      return activityLogs;
    } else {
      console.log("No activity logs found for this negotiationId.");
      return [];
    }
  } catch (error) {
    console.error("Error getting activity logs:", error);
    return [];
  }
};
