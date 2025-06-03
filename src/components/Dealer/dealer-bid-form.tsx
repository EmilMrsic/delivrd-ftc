import { ClientDataType } from "@/lib/models/client";
import { ModalForm } from "../tailwind-plus/modal-form";

export const DealerBidForm = ({
  vehicle,
  onClose,
}: {
  vehicle: ClientDataType & { bidNum: number; trade: boolean };
  onClose: () => void;
}) => {
  return (
    <ModalForm
      title={`${vehicle.Brand} ${vehicle.Model}`}
      fields={[
        {
          type: "break",
          name: "break1",
        },
        {
          label: "Selling Price - Excluding Tax & Title",
          name: "price",
          required: true,
        },
        {
          label: "Discount Amount",
          name: "discountPrice",
          required: true,
        },
        {
          type: "break",
          name: "break1",
        },
        {
          label: "Inventory Status",
          name: "inventoryStatus",
          required: true,
          type: "multiButtonSelect",
          options: [
            { label: "In Stock", value: "In Stock" },
            { label: "In Transit", value: "In Transit" },
          ],
          defaultValue: "In Stock",
        },
      ]}
      submitButtonLabel="Submit"
      onSubmit={async (values) => {}}
      onClose={() => {
        onClose();
      }}
    />
  );
};
