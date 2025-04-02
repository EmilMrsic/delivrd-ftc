import React, { useState, useEffect } from "react";
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

interface EditableDropdownProps {
  label: string;
  options: string[];
  value: string;
  negotiationId: string;
  field: string;
  onChange: (newValue: string) => void;
  userField?: string;
}

const EditableDropdown: React.FC<EditableDropdownProps> = ({
  label,
  options,
  value,
  negotiationId,
  field,
  onChange,
  userField,
}) => {
  const [selectedValue, setSelectedValue] = useState(value);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = async (newValue: string) => {
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
        const negotiationDocRef = doc(
          db,
          "delivrd_negotiations",
          negotiationId
        );

        await updateDoc(negotiationDocRef, {
          [field]: newValue,
        });

        const userDocRef = doc(db, "users", userDoc.id);
        if (userField)
          await updateDoc(userDocRef, {
            [userField]: value,
          });

        console.log(
          "Updated negotiation field:",
          field,
          "with value:",
          newValue
        );
        toast({ title: "Field Updated" });
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
