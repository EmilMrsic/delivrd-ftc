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

interface EditableTextAreaProps {
  value: string;
  onChange: (newValue: string) => void;
  negotiationId: string;
  field: string;
  userField?: string;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onChange,
  negotiationId,
  field,
  userField,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleBlur = async () => {
    if (negotiationId && field) {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("negotiations", "array-contains", negotiationId)
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
        if (userField)
          await updateDoc(userDocRef, {
            [userField]: value,
          });

        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        await updateDoc(negotiationDocRef, {
          [field]: value,
        });

        console.log("Updated negotiation field:", field, "with value:", value);
      } catch (error) {
        console.error("Error handling blur operation:", error);
      }
    }
  };

  return (
    <div className="flex items-center w-full h-[170px]">
      <textarea
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleBlur();
        }}
        className={` resize-none ${
          isFocused
            ? "border-2 rounded border-blue-500" // Box border when focused
            : "border-b-2 border-orange-500" // Bottom orange border when not focused
        } px-2 py-1 w-full h-full focus:outline-none`}
      />
    </div>
  );
};

export default EditableTextArea;
