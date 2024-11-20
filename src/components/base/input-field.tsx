import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

interface EditableInputProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  negotiationId: string;
  field: string;
}

const EditableInput: React.FC<EditableInputProps> = ({
  label,
  value,
  onChange,
  negotiationId,
  field,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleBlur = async () => {
    if (negotiationId && field) {
      try {
        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        await updateDoc(negotiationDocRef, {
          [field]: value,
        });

        console.log("Updated negotiation field:", field, "with value:", value);
      } catch (error) {
        console.error("Error updating negotiation:", error);
      }
    }
  };

  return (
    <div className="flex items-center w-full">
      <label className="font-bold text-[15px]">{label}:</label>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleBlur();
        }}
        className={` ${
          isFocused
            ? "border-2 rounded border-blue-500" // Box border when focused
            : "border-b-2 border-orange-500" // Bottom orange border when not focused
        } px-2 py-1 focus:outline-none`}
      />
    </div>
  );
};

export default EditableInput;
