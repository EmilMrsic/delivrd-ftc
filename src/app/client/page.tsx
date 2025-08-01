// "use client";
import { getUserFromFirebase } from "@/lib/user";
import { useEffect } from "react";
import { ClientSideProfileScreen } from "@/components/screens/client-side-profile-screen";

// export async function generateMetadata({ params }: { params: any }) {
//   const user: any = await getUserFromFirebase(params.id);

//   const title = user?.name || "Title";
//   const description = "Active vehicle negotiation";

//   return {
//     title,
//     description,
//     image:
//       "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png",
//     openGraph: {
//       title,
//       description,
//       images: [
//         {
//           url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png",
//           width: 1200,
//           height: 630,
//         },
//       ],
//       type: "website",
//     },
//   };
// }

export default function ClientPage() {
  return <ClientSideProfileScreen />;
}
