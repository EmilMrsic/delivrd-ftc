import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

interface EditableDropdownProps {
  label: string;
  options: string[]; // Options to be displayed in the dropdown
  value: string;
  negotiationId: string; // Negotiation ID to update in Firestore
  field: string; // The specific field that should be updated in the negotiation document
  onChange: (newValue: string) => void;
}

const EditableDropdown: React.FC<EditableDropdownProps> = ({
  label,
  options,
  value,
  negotiationId,
  field,
  onChange,
}) => {
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = async (newValue: string) => {
    if (negotiationId && field) {
      try {
        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        await updateDoc(negotiationDocRef, {
          [field]: newValue,
        });

        console.log(
          "Updated negotiation field:",
          field,
          "with value:",
          newValue
        );
      } catch (error) {
        console.error("Error updating negotiation:", error);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="font-bold">{label}:</label>
      <select
        value={selectedValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setSelectedValue(newValue);
          onChange(newValue);
          handleSelect(newValue);
        }}
        className="border-b-2 border-orange-500 px-2 py-1 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EditableDropdown;
