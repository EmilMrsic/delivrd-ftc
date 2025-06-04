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
      height={80}
      fields={[
        {
          name: "alert",
          type: "infobox",
          props: {
            innerComponent: () => (
              <span className="whitespace-pre-wrap">
                <strong className="font-semibold">Trim</strong>
                <br />
                {vehicle.Trim}
              </span>
            ),
            color: "blue",
          },
        },
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
            { label: "Out of Stock", value: "Out of Stock" },
          ],
          defaultValue: "In Stock",
          props: {
            checkboxes: true,
            asRadio: true,
          },
        },
        {
          label: "Additional Comments",
          name: "comments",
          type: "textarea",
        },
        {
          label: "Upload Files",
          name: "files",
          type: "files",
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
