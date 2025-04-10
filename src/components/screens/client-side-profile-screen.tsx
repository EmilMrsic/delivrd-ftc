"use client";

import { useEffect, useState } from "react";
import { TeamHeader } from "../base/header";
import { Card } from "../ui/card";
import { useParams } from "next/navigation";
import { getNegotiationsByClientId } from "@/lib/helpers/negotiation";
import { ClientProfile } from "../Team/profile/client-profile";
import Profile from "@/app/client/[id]/Profile";

export const ClientSideProfileScreen = () => {
  const { id } = useParams();
  const [negotiationId, setNegotiationId] = useState<string | null>(null);

  useEffect(() => {
    getNegotiationsByClientId(id as string).then((negotiations) => {
      setNegotiationId(negotiations[0].id);
    });
  }, [id]);

  //   return <Profile />;

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      {negotiationId && (
        <ClientProfile negotiationId={negotiationId} clientMode={true} />
      )}
    </div>
  );
};
