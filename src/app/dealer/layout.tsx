"use client";
import { TeamHeader } from "@/components/base/header";
import { Card, CardContent } from "@/components/ui/card";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto p-4 space-y-6 min-h-screen w-full">
      <TeamHeader />
      <Card className="bg-white shadow-lg">
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
