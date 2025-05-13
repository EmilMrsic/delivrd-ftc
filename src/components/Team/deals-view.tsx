import { NegotiationDataType } from "@/lib/models/team";

export const DealsView = ({
  deals,
  setSelectedDeal,
}: {
  deals: NegotiationDataType[];
  setSelectedDeal: (deal: NegotiationDataType) => void;
}) => {
  return (
    <div>
      <ul>
        {deals.map((deal) => (
          <li
            key={deal.id}
            onClick={() => setSelectedDeal(deal)}
            className="text-xl cursor-pointer text-blue-500"
          >
            {deal.clientNamefull}
          </li>
        ))}
      </ul>
    </div>
  );
};
