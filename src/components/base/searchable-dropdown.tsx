import React, { useState, useEffect } from "react";
import Select from "react-select";
import { doc, updateDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "@/firebase/config";

interface EditableDropdownProps {
  options: string[]; // Array of strings for dropdown options
  label: string;
  value: string;
  negotiationId: string;
  field: string;
}

const SearchableDropdown: React.FC<EditableDropdownProps> = ({
  options,
  label,
  value,
  negotiationId,
  field,
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
      const negotiationRef = doc(db, "negotiations", negotiationId);
      await updateDoc(negotiationRef, {
        [field]: newValue,
      });
      console.log("Updated negotiation with new value:", newValue);
    } catch (error) {
      console.error("Error updating negotiation:", error);
    }
  };

  const formattedOptions = options.map((option) => ({
    label: option,
    value: option,
  }));

  return (
    <div className="flex items-center space-x-2">
      <label className="font-bold w-fit whitespace-nowrap">{label}:</label>
      <Select
        options={formattedOptions}
        onChange={handleDropdownChange}
        value={
          formattedOptions.find((option) => option.value === selectedValue) ||
          null
        }
        className="w-full"
        placeholder="Select an option"
      />
    </div>
  );
};

export default SearchableDropdown;
