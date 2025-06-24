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

export const filesToUploadedUrls = async (
  files: FileList
): Promise<string[]> => {
  let fileUrls: string[] = [];
  if (files?.length) {
    const fileArray = Array.from(files);
    // @ts-ignore
    const uploadResults = await Promise.allSettled(fileArray.map(uploadFile));
    fileUrls = uploadResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<string>).value);
  }

  return fileUrls;
};
