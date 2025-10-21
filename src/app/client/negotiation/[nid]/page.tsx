"use client";

import { TeamHeader } from "@/components/base/header";
import { ClientProfile } from "@/components/Team/profile/client-profile";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ClientNegotiationPage() {
  const { nid } = useParams();
  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader clientMode={true} />
      <div className="max-w-[400px] text-center mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-50 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex flex-col items-center space-x-2 w-[80%] mx-auto"
        >
          <span className="font-medium text-center">Questions or issues?</span>
          <span className="text-xl">
            Text <Link href={"tel:9807587488"}>(980) 758-7488</Link>
          </span>
        </motion.div>
      </div>
      <ClientProfile negotiationId={nid as string} clientMode={true} />"
    </div>
  );
}
