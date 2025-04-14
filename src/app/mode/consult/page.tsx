"use client";
import { TeamHeader } from "@/components/base/header";
import { Card, CardContent } from "@/components/ui/card";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useMemo } from "react";

export default function ConsultMode() {
  const dayToSort = useMemo(() => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  }, []);

  const { negotiations } = useNegotiations({
    all: true,
    mode: "consult",
    filter: {
      createdAt: dayToSort,
    },
  });

  console.log("negotiations", negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <Card className="bg-white shadow-lg">
        <CardContent>test</CardContent>
      </Card>
    </div>
  );
}
