import { TailwindPlusTable } from "../tailwind-plus/table";

//wherrera@toyotagallatin.com
export const PreviousBidsTable = ({ dealerBids }: { dealerBids: any }) => {
  console.log("got dealer bids:", dealerBids);
  return (
    <>
      <TailwindPlusTable headers={[]} rows={[]} />
    </>
  );
};
