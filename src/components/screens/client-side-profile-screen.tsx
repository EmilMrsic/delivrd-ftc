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

export const ClientSideProfileScreen = () => {
  const { id } = useParams();
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const params = useSearchParams();
  const shared = params.get("shared");
  const { isExpired, data } = useClientShareStatus(shared);
  const logUser = localStorage.getItem("user");
  const user = JSON.parse(logUser ?? "");
  const router = useRouter();

  useEffect(() => {
    getNegotiationsByClientId(id as string).then((negotiations) => {
      setNegotiationId(negotiations[0].id);
    });
  }, [id]);

  //   return <Profile />;

  useEffect(() => {
    console.log("you even here");
    if (
      shared?.length &&
      user?.id &&
      data &&
      user?.privilege !== "Team" &&
      (shared !== data.id || user.id !== data.clientId)
    ) {
      router.push("/");
      return;
    }

    const timeout = setTimeout(() => {
      if (data === null && shared?.length) {
        console.warn("No data received within time limit — redirecting");
        router.push("/");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [data, user, shared, router]);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      {negotiationId && (
        <ClientProfile negotiationId={negotiationId} clientMode={true} />
      )}
    </div>
  );
};
