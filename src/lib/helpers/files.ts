import { storage } from "@/firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const uploadFile = async (file: File): Promise<string | null> => {
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
