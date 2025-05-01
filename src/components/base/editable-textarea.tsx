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

interface EditableTextAreaProps {
  value: string;
  onChange: (newValue: string) => void;
  negotiationId: string;
  field: string;
  userField?: string;
  onBlur?: () => void;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onChange,
  negotiationId,
  field,
  userField,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleBlur = async () => {
    if (negotiationId && field) {
      console.log("handleBlur", negotiationId, field, value);
      try {
        // const usersQuery = query(
        //   collection(db, "users"),
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
        // console.log("User found:", userDoc.id, userDoc.data());
        // const userDocRef = doc(db, "users", userDoc.id);
        // if (userField)
        //   await updateDoc(userDocRef, {
        //     [userField]: value,
        //   });

        const negotiationDocRef = doc(
          db,
          "delivrd_negotiations",
          negotiationId
        );

        await updateDoc(negotiationDocRef, {
          [field]: value,
        });

        toast({
          title: "Field Updated",
        });

        console.log("Updated negotiation field:", field, "with value:", value);
      } catch (error) {
        console.error("Error handling blur operation:", error);
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const isTruncated = value.length > 20 && !isFocused;
      // inputRef.current.value = isTruncated ? value.slice(0, 20) : value;
      inputRef.current.value = value;
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [value, isFocused]);

  console.log("value:", value);

  return (
    <div className="flex items-center w-full">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          console.log("e.target.value:", e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleBlur();
          onBlur?.();
        }}
        className={` resize-none ${
          isFocused
            ? "border-2 rounded border-blue-500"
            : "border-b-2 border-orange-500"
        } px-2 py-1 w-full h-full focus:outline-none`}
        style={{
          overflow: "hidden",

          height: "auto",
        }}
      />
    </div>
  );
};

export default EditableTextArea;
