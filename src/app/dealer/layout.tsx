"use client";
import { TeamHeader } from "@/components/base/header";
import { Loader } from "@/components/base/loader";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/firebase/config";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { DealerContext } from "@/lib/context/dealer-context";
import { DealerDataType } from "@/lib/models/dealer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useLoggedInUser();
  const [dealer, setDealer] = useState<DealerDataType | null>(null);

  useEffect(() => {
    if (user) {
      (async () => {
        const dealerTable = collection(db, "Dealers");
        const q = query(
          dealerTable,
          where("id", "==", user?.dealer_id?.[0] || user?.dealer_id)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          setDealer(doc.data() as DealerDataType);
        });
      })();
    }
  }, [user]);

  if (!dealer) return <Loader />;

  return (
    <div className="mx-auto p-4 space-y-6 min-h-screen w-full">
      <TeamHeader dealerMode={true} />
      <Card className="bg-white shadow-lg">
        <CardContent>
          <DealerContext.Provider value={dealer}>
            {children}
          </DealerContext.Provider>
        </CardContent>
      </Card>
    </div>
  );
}
