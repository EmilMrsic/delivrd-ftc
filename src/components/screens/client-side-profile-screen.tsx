"use client";

import { useEffect, useState } from "react";
import { TeamHeader } from "../base/header";
import { useSearchParams } from "next/navigation";
import { getNegotiationsByClientId } from "@/lib/helpers/negotiation";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusTable } from "../tailwind-plus/table";

export const ClientSideProfileScreen = () => {
  const [negotiations, setNegotiations] = useState<
    NegotiationDataType[] | null
  >(null);
  const params = useSearchParams();
  const shared = params.get("shared");
  // const { isExpired, data } = useClientShareStatus(shared);
  const user = useLoggedInUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.id && !negotiations) {
      getNegotiationsByClientId(user?.id as string).then((negotiations) => {
        setNegotiations(negotiations);
        // setNegotiationId(negotiations[0].id);
      });
    }
  }, [user]);

  // useEffect(() => {
  //   if (user) {
  //     console.log("user:", user);
  //     if (user?.privilege !== "Team") {
  //       if (user?.id.trim() !== (id as string).trim()) {
  //         // if (!shared || shared !== data?.id || user.id !== data?.clientId) {
  //         //   console.log("redirecting to home", user?.id, data?.clientId, data);
  //         router.push("/");
  //         //   return;
  //         // }
  //       }
  //     }
  //   }
  // }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader clientMode={true} />

      <TailwindPlusTable
        headers={["Name", "Deal #", "Make", "Model", "Status"]}
        rows={
          negotiations?.map((negotiation, idx) => {
            const dealNumber = negotiations.length - idx;
            return [
              negotiation.clientNamefull,
              dealNumber,
              negotiation.brand,
              negotiation.model,
              negotiation.stage,
            ];
          }) || []
        }
        rowConfigs={negotiations?.map((negotiation) => ({
          onClick: () => {
            window.location.href = `/client/negotiation/${negotiation.id}`;
          },
        }))}
      />

      {/* {negotiationId && (
        <ClientProfile negotiationId={negotiationId} clientMode={true} />
      )} */}
    </div>
  );
};

// 3fz6TO4HGd48fEdXqaXJ
