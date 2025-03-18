import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { EditNegotiationData } from "@/types";
import { Phone } from "lucide-react";
import { Checkbox, Field, Label } from "@headlessui/react";
import { TailwindPlusInput } from "../tailwind-plus/input";
import SearchableDropdown from "./searchable-dropdown";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-custom.css";
import DatePicker from "react-datepicker";
import clsx from "clsx";

interface EditableInputProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  negotiationId: string;
  field: string;
  userField?: string;
  negotiations?: EditNegotiationData | null;
  firstName?: string;
  lastName?: string;
}

const EditableInput: React.FC<EditableInputProps> = ({
  label,
  value,
  onChange,
  negotiationId,
  field,
  userField,
  negotiations,
  firstName,
  lastName,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleBlur = async () => {
    return;
    if (negotiationId && field) {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("negotiation_id", "array-contains", negotiationId)
        );

        const userSnapshot = await getDocs(usersQuery);

        if (userSnapshot.empty) {
          console.error(
            "No user found with this negotiationId:",
            negotiationId
          );
          return;
        }

        const userDoc = userSnapshot.docs[0];
        console.log("User found:", userDoc.id, userDoc.data());
        const userDocRef = doc(db, "users", userDoc.id);

        if (userField) {
          let newValue = "";

          if (userField === "firstName" || userField === "lastName") {
            newValue = firstName + " " + lastName;
          }

          await updateDoc(userDocRef, {
            name: newValue,
          });
        }

        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        const colorOptions =
          negotiations?.otherData?.negotiations_Color_Options;

        if (field.includes("negotiations_Color_Options") && colorOptions) {
          const property = field.split(".")[1]; // Get the property name (e.g., 'interior_preferred')

          if (colorOptions.hasOwnProperty(property)) {
            const updatedColorOptions = {
              ...colorOptions,
              [property]: value, // Update the specific property in the object
            };

            await updateDoc(negotiationDocRef, {
              negotiations_Color_Options: updatedColorOptions,
            });
            toast({
              title: "Field Updated",
            });
          } else {
            console.error(
              `Property ${property} not found in negotiations_Color_Options object`
            );
          }
        } else {
          await updateDoc(negotiationDocRef, {
            [field]: value,
          });
          toast({
            title: "Field Updated",
          });
          console.log(
            "Updated negotiation field:",
            field,
            "with value:",
            value
          );
        }
      } catch (error) {
        console.error("Error handling blur operation:", error);
      }
    }
  };
  const truncateValue = (value: string) => {
    if (value.length > 20) {
      return `${value.slice(0, 20)}...`;
    }
    return value;
  };

  return (
    <Field className="w-full">
      <Label className="font-bold text-[15px]">{label}:</Label>
      <TailwindPlusInput
        ref={inputRef}
        type="text"
        value={isFocused ? value : truncateValue(value)}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleBlur();
        }}
      />
    </Field>
  );
};

export const InputField = (props: {
  label: string;
  value: string;
  onChange?: (newValue: string) => void;
  negotiationId: string;
  field: string;
  userField?: string;
  negotiations?: EditNegotiationData | null;
  firstName?: string;
  lastName?: string;
  options?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  type?: "text" | "searchableDropdown" | "datePicker";
  dateFormat?: string;
  placeholderText?: string;
  selected?: Date;
}) => {
  const Icon = props.icon;

  if (props.type === "datePicker") {
    console.log("got here:", props.type);
  }

  let InputComponent;
  switch (props.type) {
    case "searchableDropdown":
      InputComponent = SearchableDropdown;
      break;
    case "datePicker":
      InputComponent = DatePicker;
      break;

    default:
      InputComponent = EditableInput;
  }

  const ComponentDisplay = (
    <InputComponent
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      negotiationId={props.negotiationId}
      field={props.field}
      userField={props.userField}
      negotiations={props.negotiations}
      options={props.options}
      dateFormat={props.dateFormat}
      placeholderText={props.placeholderText}
      selected={props.selected}
      className={
        props.type === "datePicker"
          ? clsx(
              "block w-full rounded-lg border border-transparent ring-1 shadow-sm ring-black/10 p-2 cursor-pointer",
              "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)] text-base/6 sm:text-sm/6",
              "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black"
            )
          : ""
      }
    />
  );

  const FieldDisplay = <>{ComponentDisplay}</>;

  return (
    <div className="flex items-center space-x-2 text-[#202125]">
      {props.type === "datePicker" ? (
        <>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
          <Field className="w-full">
            <Label className="font-bold text-[15px]">{props.label}:</Label>
            <div className="w-full">{FieldDisplay}</div>
          </Field>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
          {FieldDisplay}
        </>
      )}
    </div>
  );
};

export default EditableInput;
