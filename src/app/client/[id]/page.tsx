// "use client";
import { getUserFromFirebase } from "@/lib/user";
import Profile from "./Profile";

export async function generateMetadata({ params }: { params: any }) {
  const user: any = await getUserFromFirebase(params.id);
  console.log("got here 2:", user);

  const title = user?.name || "Title";
  const description = "Active vehicle negotiation";

  return {
    title,
    description,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png",
    openGraph: {
      title,
      description,
      images: [
        {
          url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png",
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },
  };
}

export const ClientPage = () => {
  return (
    <>
      <Profile />
    </>
  );
};

export default ClientPage;
