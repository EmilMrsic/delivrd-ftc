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
import { formatDateToLocal } from "@/lib/helpers/dates";
import { NegotiationDataType } from "@/lib/models/team";
import EditableTextArea from "./editable-textarea";
import { TailwindPlusToggle } from "../tailwind-plus/toggle";

interface EditableInputProps {
  label?: string;
  value: string | number;
  onChange: (newValue: string) => void;
  negotiationId: string;
  field: string;
  userField?: string;
  negotiations?: NegotiationDataType | null;
  firstName?: string;
  lastName?: string;
  parentKey?: string;
  onBlur?: () => void;
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
  parentKey,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value as string;
    }
  }, [value]);

  const handleBlur = async () => {
    onBlur?.();
  };

  const truncateValue = (value: string) => {
    if (value.length > 20) {
      return `${value.slice(0, 20)}...`;
    }
    return value;
  };

  return (
    <Field className="w-full">
      {label ? (
        <Label className="font-bold text-[15px]">{label}:</Label>
      ) : (
        <div className="h-6 w-5"></div>
      )}
      <TailwindPlusInput
        ref={inputRef}
        type="text"
        value={value} // : truncateValue(value as string)}
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
  disabled?: boolean;
  label?: string;
  value?: string | number;
  onChange?: (newValue: string) => void;
  onDateChange?: (newValue: Date | null) => void;
  negotiationId?: string;
  field?: string;
  userField?: string;
  negotiations?: NegotiationDataType | null;
  firstName?: string;
  lastName?: string;
  options?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  type?: "text" | "searchableDropdown" | "datePicker" | "textarea" | "toggle";
  dateFormat?: string;
  placeholderText?: string;
  selected?: Date | null;
  parentKey?: string;
  readOnly?: boolean;
  checked?: boolean;
  onToggle?: (newValue: boolean) => void;
  as?: React.ComponentType<any>;
  tableOverride?: string;
  evalFn?: (value: string) => {
    pass: boolean;
    message?: string;
  };
}) => {
  const { toast } = useToast();
  const { as: AsComponent } = props;
  const [value, setValue] = useState<any>(props.value ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (valueOverride?: any) => {
    // TODO: find some way to make this generic or move out to a component
    // as its currently used only for team-profile
    const {
      disabled,
      negotiationId,
      field,
      userField,
      parentKey,
      firstName,
      lastName,
      evalFn,
    } = props;

    if (disabled) {
      return;
    }

    if (negotiationId && field) {
      if (evalFn) {
        console.log("running evaluation", evalFn);
        const result = evalFn(value);
        console.log("got eval result", result);
        if (!result.pass) {
          setError(result.message || "Invalid value");
          return;
        } else {
          setError(null);
        }
      }
      try {
        // const usersQuery = query(
        //   collection(db, "delivrd_users"),
        //   where("negotiation_id", "array-contains", negotiationId)
        // );

        // const userSnapshot = await getDocs(usersQuery);

        // if (userSnapshot.empty) {
        //   console.error(
        //     "No user found with this negotiationId:",
        //     negotiationId
        //   );
        //   return;
        // }

        // const userDoc = userSnapshot.docs[0];
        // const userDocRef = doc(db, "users", userDoc.id);

        // if (userField) {
        //   let newValue = "";

        //   if (userField === "firstName" || userField === "lastName") {
        //     newValue = firstName + " " + lastName;
        //   }

        //   await updateDoc(userDocRef, {
        //     clientNamefull: newValue,
        //   });
        // }

        const negotiationDocRef = doc(
          db,
          props.tableOverride ?? "delivrd_negotiations",
          negotiationId
        );

        let keyName = field;
        if (parentKey) {
          keyName = parentKey + "." + field;
        }
        let useableValue = value;

        if (valueOverride !== undefined) {
          useableValue = valueOverride;
        }

        const updateObject = {
          [keyName]: useableValue,
        };

        if (field === "clientFirstName" || field === "clientLastName") {
          updateObject["clientNamefull"] = firstName + " " + lastName;
        }

        const result = await updateDoc(negotiationDocRef, updateObject);

        toast({
          title: "Field Updated",
        });
      } catch (error) {
        console.error("Error handling blur operation:", error);
      }
    }
  };

  if (props.readOnly) {
    return (
      <div className="flex items-start space-x-2 text-[#202125]">
        {props.icon && <props.icon className="h-5 w-5 text-gray-400" />}
        {props.label && (
          <div className="font-bold text-[15px] whitespace-nowrap">
            {props.label}:
          </div>
        )}
        <div className="text-[15px] ">{props.value}</div>
      </div>
    );
  }

  const Icon = props.icon;

  let InputComponent;
  switch (props.type) {
    case "searchableDropdown":
      InputComponent = SearchableDropdown;
      break;
    case "datePicker":
      InputComponent = DatePicker;
      break;

    case "textarea":
      InputComponent = EditableTextArea;
      break;
    case "toggle":
      InputComponent = TailwindPlusToggle;
      break;

    default:
      InputComponent = EditableInput;
  }

  if (AsComponent) {
    InputComponent = AsComponent;
  }

  const ComponentDisplay =
    props.type === "datePicker" ? (
      <DatePicker
        selected={props.selected}
        onChange={(date) => {
          props.onDateChange?.(date);
        }}
        className={clsx(
          "block w-full rounded-lg border border-transparent ring-1 shadow-sm ring-black/10 p-2 cursor-pointer",
          "px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)] text-base/6 sm:text-sm/6",
          "data-focus:outline data-focus:outline-2 data-focus:-outline-offset-1 data-focus:outline-black"
        )}
      />
    ) : (
      <InputComponent
        label={props.label}
        value={(value ?? "") as string}
        onChange={(value: any) => {
          setValue(value);
        }}
        negotiationId={props.negotiationId ?? ""}
        field={props.field ?? ""}
        userField={props.userField}
        negotiations={props.negotiations}
        options={props.options ?? []}
        dateFormat={props.dateFormat}
        placeholderText={props.placeholderText}
        selected={props.selected}
        parentKey={props.parentKey}
        onBlur={() => {
          if (!props.type || props.type === "text") {
            handleUpdate();
          }

          if (props.type === "datePicker") {
            props.onDateChange?.(value as Date | null);
          } else {
            props.onChange?.(value as string);
          }
        }}
        onToggle={(e: boolean) => {
          if (props.onToggle) {
            props.onToggle(e);
          }
          handleUpdate(e);

          if (props.type === "datePicker") {
            props.onDateChange?.(value as Date | null);
          } else {
            props.onChange?.(value as string);
          }
        }}
        checked={props.checked}
        tableOverride={props.tableOverride}
      />
    );

  const FieldDisplay = <>{ComponentDisplay}</>;

  return (
    <>
      <div className="flex items-center space-x-2 text-[#202125]">
        {props.type === "datePicker" || props.type === "textarea" ? (
          <>
            {Icon && <Icon className="h-5 w-5 text-gray-400" />}
            <Field className="w-full">
              {props.label && (
                <Label className="font-bold text-[15px]">{props.label}:</Label>
              )}
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
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </>
  );
};

export default EditableInput;
