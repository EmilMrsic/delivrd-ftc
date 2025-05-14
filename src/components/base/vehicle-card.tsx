import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Vehicle } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, XIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface IVehicleCardProps {
  vehicle: Vehicle;
  selectedVehicles: string[];
  toggleVehicleSelection: (id: string) => void;
  submitBid: (
    id: string,
    price: string,
    message: string,
    discountPrice: string,
    inventoryStatus: string,
    files: FileList | null,
    negotiationId: string
  ) => void;
  negotiationId: string;
}

export const bidSchema = z.object({
  price: z.number().min(1, "Price must be greater than 0").optional(),
  message: z.string().optional(),
  files: z.any().optional(),
});

const VehicleCard: FC<IVehicleCardProps> = ({
  vehicle,
  selectedVehicles,
  toggleVehicleSelection,
  submitBid,
  negotiationId,
}) => {
  const [formValues, setFormValues] = useState({
    price: "",
    message: "",
    discountPrice: "",
    inventoryStatus: "",
    files: null as FileList | null,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const user = localStorage.getItem("user");
  let parsedUser;
  if (user) {
    parsedUser = JSON.parse(user);
  }

  const newEntry = vehicle.createdAt
    ? new Date(vehicle.createdAt) >= new Date(parsedUser.lastLogin)
    : false;

  const handleSubmit = () => {
    const price = parseFloat(formValues.price);
    const discountPrice = parseFloat(formValues.discountPrice);
    if (
      formValues.price == "" ||
      formValues.inventoryStatus == "" ||
      formValues.discountPrice == ""
    ) {
      toast({
        title:
          "Please fill-in all the required feilds before submitting the bid.",
        variant: "destructive",
      });
    } else {
      const formData = {
        price: isNaN(price) ? undefined : price,
        discountAmount: isNaN(discountPrice) ? undefined : discountPrice,
        message: formValues.message,
        file: formValues.files,
      };

      const result = bidSchema.safeParse(formData);

      if (!result.success) {
        setErrors(result.error.errors.map((e) => e.message));
        return;
      }

      setErrors([]);
      submitBid(
        vehicle.id || "",
        formValues.price,
        formValues.message,
        formValues.discountPrice,
        formValues.inventoryStatus,
        formValues.files,
        negotiationId
      );
    }
  };

  console.log("vehicle", vehicle);

  return (
    <Card
      key={vehicle.id}
      className={` ${
        vehicle.NewOrUsed === "Used" ? "bg-[#FFEFCE]" : ""
      } relative z-10 transition-all duration-300 ${
        selectedVehicles.includes(vehicle.id || "") ? "ring-2 ring-primary" : ""
      }`}
    >
      {newEntry && (
        <div className="w-full flex justify-center">
          <Badge
            variant="outline"
            style={{ zIndex: 20 }}
            className={`absolute -top-2.5 font-semibold bg-yellow-100 text-yellow-800 border-yellow-300}`}
          >
            <p>New Opportunity</p>
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2 bg-gradient-to-r from-[#0989E5] to-[#202125] mb-5">
        <CardTitle className="text-xl mb-2 text-white flex items-center gap-3">
          <Image
            src="/car.svg"
            width={25}
            height={25}
            alt="car"
            className="transform scale-x-[-1] filter invert"
          />
          {vehicle.brand +
            " " +
            vehicle.name?.replaceAll(vehicle.brand || "", "")}
        </CardTitle>
      </CardHeader>

      <div className="flex items-center justify-between mx-6 ">
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id={`select-${vehicle.id}`}
            checked={selectedVehicles.includes(vehicle.id || "")}
            onCheckedChange={() => toggleVehicleSelection(vehicle.id || "")}
          />
          <Label
            htmlFor={`select-${vehicle.id}`}
            className="text-sm font-medium"
          >
            Bid on this one
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">New or Used:</span>
          <Badge
            variant="outline"
            className={`font-semibold ${
              vehicle.NewOrUsed === "New"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-blue-100 text-blue-800 border-blue-300"
            }`}
          >
            {vehicle.NewOrUsed === "New" ? "New" : "Used"}
          </Badge>
        </div>
      </div>
      <CardContent className="pb-0">
        <p className="text-sm text-muted-foreground mb-1">
          Zip Code: {vehicle.zipCode}
        </p>
        <p className="text-sm text-muted-foreground mb-4">{vehicle.trim}</p>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div>
            {(vehicle.desiredExterior || vehicle.excludedExterior) && (
              <h4 className="font-semibold mb-2">Exterior Colors</h4>
            )}
            <div className="grid grid-cols-2 gap-2">
              {vehicle.desiredExterior && (
                <div className="flex items-center">
                  <CheckIcon
                    width={16}
                    height={16}
                    className="  text-green-500 w-4 h-4 mr-2"
                  />
                  <span className="text-sm max-w-[150px]">
                    {vehicle.desiredExterior}
                  </span>
                </div>
              )}
              {vehicle.excludedExterior && (
                <div className="flex items-center">
                  <XIcon
                    width={16}
                    height={16}
                    className="text-destructive w-4 h-4 mr-2"
                  />
                  <span className="text-sm max-w-[150px]">
                    {vehicle.excludedExterior}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            {(vehicle.desiredInterior || vehicle.excludedInterior) && (
              <h4 className="font-semibold mb-2">Interior Colors</h4>
            )}
            <div className="grid grid-cols-2 gap-2">
              {vehicle.desiredInterior && (
                <div className="flex items-center">
                  <CheckIcon
                    width={16}
                    height={16}
                    className="  text-green-500 w-4 h-4 mr-2"
                  />
                  <span className="text-sm max-w-[150px]">
                    {vehicle.desiredInterior}
                  </span>
                </div>
              )}
              {vehicle.excludedInterior && (
                <div className="flex items-center">
                  <XIcon
                    width={16}
                    height={16}
                    className="text-destructive w-4 h-4 mr-2"
                  />
                  <span className="text-sm max-w-[150px]">
                    {vehicle.excludedInterior}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Drivetrain:</h4>
            <Badge variant="outline" className="text-sm">
              {vehicle.drivetrain}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter
        className={`flex flex-col gap-4 bg-${
          vehicle.NewOrUsed === "Used" ? "bg-[#FFEFCE]" : "muted/50"
        } mt-6 p-6`}
      >
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor={`price-${vehicle.id}`}>
            <strong>Selling Price - Excluding Tax & Title*</strong>
          </Label>
          <Input
            id={`price-${vehicle.id}`}
            type="number"
            placeholder="Enter price"
            value={formValues.price}
            onChange={(e) =>
              setFormValues({ ...formValues, price: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor={`price-${vehicle.id}`}>
            <strong>Discount Amount*</strong>
          </Label>
          <Input
            id={`price-${vehicle.id}`}
            type="number"
            placeholder="Enter price"
            value={formValues.discountPrice}
            onChange={(e) =>
              setFormValues({ ...formValues, discountPrice: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label>
            <strong>Inventory Status*:</strong>
          </Label>
          <RadioGroup
            onValueChange={(value) =>
              setFormValues({ ...formValues, inventoryStatus: value })
            }
            defaultValue={formValues.inventoryStatus}
            className="flex flex-col space-y-[2px]"
          >
            <div className="flex items-center">
              <RadioGroupItem value="In Stock" className="mr-2" />
              <Label htmlFor={`inventory-available-${vehicle.id}`}>
                <strong>In Stock</strong>
              </Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="In Transit" className="mr-2" />
              <Label htmlFor={`inventory-available-${vehicle.id}`}>
                <strong>In Transit</strong>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor={`message-${vehicle.id}`}>
            <strong>Additional comments</strong>
          </Label>
          <Textarea
            id={`message-${vehicle.id}`}
            placeholder="Enter any additional information"
            value={formValues.message}
            onChange={(e) =>
              setFormValues({ ...formValues, message: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor={`file-${vehicle.id}`}>Upload files</Label>
          <Input
            id={`file-${vehicle.id}`}
            type="file"
            multiple
            onChange={(e) =>
              setFormValues({
                ...formValues,
                files: e.target.files ? e.target.files : null,
              })
            }
          />
        </div>
        {errors.length > 0 && (
          <div className="text-red-500">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        <Button
          className="w-full mt-2 bg-gradient-to-r from-[#0989E5] to-[#202125]"
          onClick={handleSubmit}
        >
          Submit Bid
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VehicleCard;
