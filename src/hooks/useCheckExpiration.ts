import { useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

type ShareStatus = {
  isExpired: boolean | null;
  data: any | null;
};

const useClientShareStatus = (id: string | null): ShareStatus => {
  const [isExpired, setIsExpired] = useState<boolean | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const checkExpiration = async () => {
      console.log({ id });
      if (!id) return;

      try {
        const docRef = doc(db, "delivrd_client_share", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setIsExpired(true);
          setData(null);
          return;
        }

        const docData = docSnap.data();
        setData(docData);

        const createdAt = docData.createdAt;
        if (!createdAt) {
          setIsExpired(true);
          return;
        }

        const createdTime =
          createdAt instanceof Timestamp
            ? createdAt.toDate().getTime()
            : new Date(createdAt).getTime();

        const now = Date.now();
        const thirtySeconds = 30 * 1000;

        setIsExpired(now - createdTime > thirtySeconds);
      } catch (error) {
        console.error("Error checking shared link:", error);
        setIsExpired(true);
        setData(null);
      }
    };

    checkExpiration();
  }, [id]);

  return { isExpired, data };
};

export default useClientShareStatus;
