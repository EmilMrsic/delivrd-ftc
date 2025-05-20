import { useMemo } from "react";
import { TailwindPlusModal } from "./modal";
import { Formik, Form, Field } from "formik";
import { MultiButtonSelect } from "./form-widgets/multi-button-select";
import { cn } from "@/lib/utils";
import { PhoneNumberInput } from "./form-widgets/phone-number-input";
import { Infobox } from "./infobox";
import { LoomVideo } from "../ui/loom-video";

const customWidgets = {
  multiButtonSelect: MultiButtonSelect,
  phoneNumber: PhoneNumberInput,
  infobox: Infobox,
};

interface FieldType {
  label?: string;
  name: string;
  type?: string;
  defaultValue?: string | string[];
  options?: { label: string; value: string }[];
  props?: Record<string, any>;
  infobox?: {
    innerComponent: React.ComponentType<any>;
    icon?: React.ComponentType<any>;
    color?: "yellow" | "blue";
  };
}

export type Fields = (FieldType | FieldType[])[];

export const ModalForm = ({
  onClose,
  title,
  fields,
  submitButtonLabel,
  onSubmit,
  height = 50,
  width = 40,
}: {
  onClose: () => void;
  title: string;
  fields: Fields;
  submitButtonLabel: string;
  onSubmit: (values: any) => Promise<void>;
  height?: number;
  width?: number;
}) => {
  const initialValues = useMemo(() => {
    return fields.reduce((acc, field) => {
      if (Array.isArray(field)) {
        return {
          ...acc,
          ...field.reduce(
            (acc, field) => ({
              ...acc,
              [field.name]: field.defaultValue || "",
            }),
            {}
          ),
        };
      }
      return { ...acc, [field.name]: field.defaultValue || "" };
    }, {});
  }, [fields]);

  console.log("initial values", initialValues);

  return (
    <TailwindPlusModal
      close={onClose}
      width={width}
      height={height}
      className="border-4 border-blue-600 p-0 rounded-[10px] overflow-x-hidden"
      rounded={false}
    >
      <div className="bg-blue-600 text-xl text-white font-bold p-4">
        {title}
      </div>
      <div
        className={cn(
          "p-4 overflow-y-scroll max-h-[60vh]",
          height ? `max-h-[${height - 20}vh]` : ""
        )}
      >
        <Formik
          initialValues={initialValues}
          onSubmit={async (values) => {
            console.log("values", values);
            if (onSubmit) await onSubmit(values);
          }}
        >
          <Form>
            <FormFields fields={fields} />
            <div className="w-full">
              <button
                type="submit"
                className="block bg-blue-600 text-white p-2 rounded-md w-full mr-auto ml-auto"
              >
                {submitButtonLabel}
              </button>
            </div>
          </Form>
        </Formik>
      </div>
    </TailwindPlusModal>
  );
};

export const FormFields = ({ fields }: { fields: Fields }) => {
  return fields.map((field: FieldType[] | FieldType) => {
    if (Array.isArray(field)) {
      return (
        <div className="w-full flex gap-2 justify-between">
          <FormFields fields={field} />
        </div>
      );
    } else {
      return <FormField field={field} />;
    }
  });
};

export const FormField = ({ field }: { field: FieldType }) => {
  const { label, name, type, options, props, infobox } = field;
  let fieldType: string | React.ComponentType<any> = type ? type : "input";
  if (type && customWidgets[type as keyof typeof customWidgets]) {
    fieldType = customWidgets[type as keyof typeof customWidgets];
  }

  if (type === "break") {
    return <div className="w-full h-[1px] bg-gray-300 my-4" />;
  }

  if (type === "video") {
    return (
      <div className="w-full mb-4">
        {props && <LoomVideo url={props.url} />}
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={name} className="text-sm text-black font-bold">
          {label}
        </label>
      )}
      {infobox && (
        <div className="mb-2">
          <Infobox
            innerComponent={infobox.innerComponent}
            icon={infobox.icon}
            color={infobox.color}
          />
        </div>
      )}
      <Field
        name={name}
        className="border-2 border-gray-300 rounded-md p-2 w-full resize-none"
        as={fieldType}
        options={options}
        {...props}
      />
    </div>
  );
};
