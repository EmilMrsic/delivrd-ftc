import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"; // Import Firestore functions
import { db } from "@/firebase/config";
import { Field, Label } from "@headlessui/react";

interface EditableDropdownProps {
  options: string[]; // Array of strings for dropdown options
  label: string;
  value: string;
  negotiationId: string;
  field: string;
  userField?: string;
}

const SearchableDropdown: React.FC<EditableDropdownProps> = ({
  options,
  label,
  value,
  negotiationId,
  field,
  userField,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value);

  useEffect(() => {
    // If the prop `value` changes, update the selected value
    setSelectedValue(value);
  }, [value]);

  const handleDropdownChange = async (selectedOption: any) => {
    setSelectedValue(selectedOption.value);
    await triggerQuery(selectedOption.value);
  };

  const triggerQuery = async (newValue: string) => {
    try {
      // const usersQuery = query(
      //   collection(db, "users"),
      //   where("negotiation_id", "array-contains", negotiationId)
      // );

      // const userSnapshot = await getDocs(usersQuery);

      // if (userSnapshot.empty) {
      //   console.error("No user found with this negotiationId:", negotiationId);
      //   return;
      // }

      // const userDoc = userSnapshot.docs[0];
      const negotiationRef = doc(db, "delivrd_negotiations", negotiationId);
      await updateDoc(negotiationRef, {
        [field]: newValue,
      });

      // const userDocRef = doc(db, "users", userDoc.id);
      // if (userField)
      //   await updateDoc(userDocRef, {
      //     [userField]: value,
      //   });
    } catch (error) {
      console.error("Error updating negotiation:", error);
    }
  };

  const formattedOptions = options.map((option) => ({
    label: option,
    value: option,
  }));

  return (
    <Field className="w-full">
      <Label className="font-bold w-fit whitespace-nowrap">{label}:</Label>
      <Select
        options={formattedOptions}
        onChange={handleDropdownChange}
        value={
          formattedOptions.find((option) => option.value === selectedValue) ||
          null
        }
        placeholder="Select an option"
        styles={
          {
            // control: (base) => ({ ...base, zIndex: 1 }),
            // container: (base) => ({ ...base, zIndex: 0 }),
          }
        }
        menuPortalTarget={null}
      />
    </Field>
  );
};

export default SearchableDropdown;
