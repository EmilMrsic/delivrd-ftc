import { db } from "@/firebase/config";
import { collection, getDocs, or, query, where } from "firebase/firestore";

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
};

export const fetchBulkQuery = async (
  collectionName: string,
  field: string,
  ids: string[]
): Promise<any[]> => {
  if (ids.length === 0) {
    return [];
  }

  const chunks = chunkArray(ids, 30);
  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(
          collection(db, collectionName),
          or(...chunk.map((id) => where(field, "==", id)))
        )
      )
    )
  );

  const allDocs = results.flatMap((result) => {
    return result.docs.map((doc) => doc.data());
  });
  return allDocs;
};
