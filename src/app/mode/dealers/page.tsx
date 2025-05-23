"use client";
import { TeamHeader } from "@/components/base/header";
import { TeamDealersTable } from "@/components/Team/dealers/team-dealers-table";
import { Card, CardContent } from "@/components/ui/card";
import { useDealers } from "@/hooks/useDealers";
// https://www.loom.com/share/37d65d8ac41d4db097cbca896775ca29

export default function FTCTable() {
  const { dealers } = useDealers();
  return (
    <div className="mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <Card className="bg-white shadow-lg">
        <CardContent>
          <TeamDealersTable />
        </CardContent>
      </Card>
    </div>
  );
}
