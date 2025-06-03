"use client";

import { useEffect, useState } from "react";
import { TeamHeader } from "../base/header";
import { Card } from "../ui/card";
import { useParams, useSearchParams } from "next/navigation";
import { getNegotiationsByClientId } from "@/lib/helpers/negotiation";
import { ClientProfile } from "../Team/profile/client-profile";
import Profile from "@/app/client/[id]/Profile";
import useClientShareStatus from "@/hooks/useCheckExpiration";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";

export const ClientSideProfileScreen = () => {
  const { id } = useParams();
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const params = useSearchParams();
  const shared = params.get("shared");
  const { isExpired, data } = useClientShareStatus(shared);
  const user = useLoggedInUser();
  const router = useRouter();

  useEffect(() => {
    getNegotiationsByClientId(id as string).then((negotiations) => {
      console.log("negotiations", id);
      setNegotiationId(negotiations[0].id);
    });
  }, [id]);

  useEffect(() => {
    console.log("user:", user, user?.id, id);
    if (user) {
      if (user?.privilege !== "Team") {
        if (user?.id !== id) {
          if (!shared || shared !== data?.id || user.id !== data?.clientId) {
            router.push("/");
            return;
          }
        }
      }
    }
  }, [id, user, data, shared]);

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader clientMode={true} />
      {negotiationId && (
        <ClientProfile negotiationId={negotiationId} clientMode={true} />
      )}
    </div>
  );
};

// 3fz6TO4HGd48fEdXqaXJ
