import { initAdmin } from "@/firebaseAdmin";
import admin from "firebase-admin";

export const getUser = async (id: string) => {
  try {
    await initAdmin();

    const db = admin.firestore();

    const userRef = db.collection("users");
    const snapshot = await userRef.where("id", "==", id).get();

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
