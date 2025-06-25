import { toast } from "@/hooks/use-toast";
import { IncomingBidCommentType } from "../models/bids";
import Link from "next/link";

export const handleSendComment = async (
  user: any,
  data: IncomingBidCommentType
) => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_COMMENT_FUNC_URL ?? "",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    if (result.success) {
      toast({
        title: `Comment sent to ${
          user.privilege === "Client" ? "The Delivrd Team" : "client"
        }`,
      });
    } else {
      console.error("Failed to send comment:", result);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
