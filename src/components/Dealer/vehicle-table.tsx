import { ClientDataType } from "@/lib/models/client";
import { TailwindPlusTable } from "../tailwind-plus/table";

export const VehicleTable = ({ vehicles }: { vehicles: ClientDataType[] }) => {
  if (!vehicles) return <div>No vehicles found</div>;
  return (
    <TailwindPlusTable
      headers={[
        "Bid",
        "Model",
        "Trim",
        "Zip Code",
        "Desired Exterior Color",
        "Desired Interior Color",
        "Drive Train",
        "Current Bids",
        "Trade In",
      ]}
      rows={vehicles.map((vehicle) => [
        "Submit Bid",
        vehicle.Model,
        vehicle.Trim,
        vehicle.ZipCode,
        vehicle.desiredExterior,
        vehicle.desiredInterior,
        vehicle.Drivetrain,
        "0",
        "WIP",
      ])}
    />
  );
};
