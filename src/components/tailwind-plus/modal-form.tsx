import { useEffect, useMemo, useState } from "react";
import { TailwindPlusModal } from "./modal";
import { Formik, Form, Field, useFormikContext } from "formik";
import { MultiButtonSelect } from "./form-widgets/multi-button-select";
import { cn } from "@/lib/utils";
import { PhoneNumberInput } from "./form-widgets/phone-number-input";
import { Infobox } from "./infobox";
import { LoomVideo } from "../ui/loom-video";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FileUpload } from "./form-widgets/file-upload";
import { ColorDisplayCard } from "../base/color-display-card";
import { TrimDisplayCard } from "../base/trim-display-card";

const nonInputTypes = ["break", "video", "infobox"];

const customWidgets = {
  multiButtonSelect: MultiButtonSelect,
  phoneNumber: PhoneNumberInput,
  infobox: Infobox,
  files: FileUpload,
  colorDisplayCard: ColorDisplayCard,
  trimDisplayCard: TrimDisplayCard,
};

interface FieldType {
  label?: string;
  name: string;
  type?: string;
  defaultValue?: string | string[] | number | number[];
  options?: { label: string; value: string }[];
  props?: Record<string, any>;
  infobox?: {
    innerComponent: React.ComponentType<any>;
    icon?: React.ComponentType<any>;
    color?: "yellow" | "blue" | "white";
  };
  required?: boolean;
  customValidation?: (item: any) => boolean;
  size?: string;
}

export type Fields = (FieldType | FieldType[])[];

const buildZodSchema = (fields: Fields): Record<string, z.ZodType> => {
  let result: Record<string, z.ZodType> = {};

  fields.forEach((field, index) => {
    if (Array.isArray(field)) {
      result = {
        ...result,
        ...buildZodSchema(field),
      };
    } else {
      if (!field.type || !nonInputTypes.includes(field.type)) {
        result[field.name] = fieldToZodType(field);
      }
    }
  });

  return result;
};

export const fieldToZodType = (field: FieldType) => {
  let zodType: any = z.string();
  let useableType = field?.type || "text";
  if (["multiButtonSelect", "files"].includes(useableType)) {
    zodType = z.array(z.any());
  }

  if (field.required) {
    zodType = zodType.min(1);
  } else {
    zodType = zodType.optional();
  }

  if (field.customValidation) {
    zodType = field.customValidation(zodType);
  }

  return zodType;
};

export const ModalForm = ({
  onClose,
  title,
  fields,
  submitButtonLabel,
  onSubmit,
  height = 50,
  width = 40,
  onFormLoad,
}: {
  onClose: () => void;
  title: string;
  fields: Fields;
  submitButtonLabel: string;
  onSubmit: (values: any) => Promise<void>;
  height?: number;
  width?: number;
  onFormLoad?: () => void;
}) => {
  const [formLoaded, setFormLoaded] = useState(false);
  // const initialValues = useMemo(() => {
  //   return fields.reduce((acc, field) => {
  //     if (Array.isArray(field)) {
  //       return {
  //         ...acc,
  //         ...field.reduce(
  //           (acc, field) => ({
  //             ...acc,
  //             [field.name]: field.defaultValue || "",
  //           }),
  //           {}
  //         ),
  //       };
  //     }

  //     return { ...acc, [field.name]: field.defaultValue || "" };
  //   }, {});
  // }, [fields]);

  useEffect(() => {
    if (!formLoaded && onFormLoad) {
      onFormLoad();
      setFormLoaded(true);
    }
  }, [formLoaded, onFormLoad]);

  const initialValues = useMemo(() => {
    return fields.reduce((acc, field) => {
      if (Array.isArray(field)) {
        return {
          ...acc,
          ...field.reduce((acc, field) => {
            if (field.type && nonInputTypes.includes(field.type)) {
              return acc;
            }
            return {
              ...acc,
              [field.name]: field.defaultValue || "",
            };
          }, {}),
        };
      }

      if (field.type && nonInputTypes.includes(field.type)) {
        return acc;
      }

      return { ...acc, [field.name]: field.defaultValue || "" };
    }, {});
  }, [fields]);

  const formSchema = useMemo(() => z.object(buildZodSchema(fields)), [fields]);

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
          validationSchema={toFormikValidationSchema(formSchema)}
        >
          {({ errors, values }) => {
            return (
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
            );
          }}
        </Formik>
      </div>
    </TailwindPlusModal>
  );
};

export const FormFields = ({ fields }: { fields: Fields }) => {
  return fields.map((field: FieldType[] | FieldType, index: number) => {
    if (Array.isArray(field)) {
      return (
        <div className="w-full flex gap-2 justify-between" key={index}>
          <FormFields fields={field} />
        </div>
      );
    } else {
      return <FormField field={field} key={index} />;
    }
  });
};

export const FormField = ({ field }: { field: FieldType }) => {
  const formik = useFormikContext();
  const { errors, touched } = formik;
  const { label, name, type, options, props, infobox, required, size } = field;
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
    <div
      className={cn(`mb-4`)}
      style={{
        width: size || "100%",
      }}
    >
      {/* , size ? `w-[${size}]` : "w-full")}> */}
      {label && (
        <label htmlFor={name} className="text-sm text-black font-bold">
          {label} {required && <span className="text-red-500">*</span>}
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
      {errors[name as keyof typeof errors] &&
        touched[name as keyof typeof touched] && (
          <div className="text-red-500 text-sm">
            {errors[name as keyof typeof errors]}
          </div>
        )}
    </div>
  );
};
