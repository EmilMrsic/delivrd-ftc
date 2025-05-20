import { useField } from "formik";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

export const PhoneNumberInput = ({ name }: { name: string }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <PhoneInput
      style={{
        width: "100%",
        border: "2px solid rgb(209 213 219 / 1)",
        // borderColor: "rgb(209 213 219 / 1)",
        borderRadius: "5px",
        padding: "10px",
        outline: "none",
        ":focus": { outline: "none" },
      }}
      countryCallingCodeEditable={false}
      defaultCountry="US"
      value={field.value}
      onChange={helpers.setValue}
    />
  );
};
