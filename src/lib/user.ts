import { db } from "@/firebase/config";
// import { initAdmin } from "@/firebaseAdmin";
import admin from "firebase-admin";
import { collection, getDocs, query, where } from "firebase/firestore";

export const getUserData = () => {
  const userData = localStorage.getItem("user");
  if (!userData) {
    console.error("No user data found in localStorage");
    return;
  }

  const parseUserData = JSON.parse(userData);
  return parseUserData;
};

export const getUserFromFirebase = async (id: string) => {
  try {
    // await initAdmin();

    // const db = admin.firestore();

    const userRef = collection(db, "users");
    const snapshot = await getDocs(query(userRef, where("id", "==", id)));

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData;
    } else {
      console.log("No user found with the given ID");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Error fetching user data");
  }
};
