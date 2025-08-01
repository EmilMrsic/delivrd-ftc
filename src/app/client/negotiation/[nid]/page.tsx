"use client";

import { TeamHeader } from "@/components/base/header";
import { ClientProfile } from "@/components/Team/profile/client-profile";
import { useParams } from "next/navigation";

export default function ClientNegotiationPage() {
  const { nid } = useParams();
  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader clientMode={true} />
      <ClientProfile negotiationId={nid as string} clientMode={true} />"
    </div>
  );
}
