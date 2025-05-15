import { useMemo } from "react";
import { TailwindPlusModal } from "./modal";
import { Formik, Form, Field } from "formik";

interface FieldType {
  label?: string;
  name: string;
  type?: string;
  defaultValue?: string;
}

export type Fields = (FieldType | FieldType[])[];

export const ModalForm = ({
  onClose,
  title,
  fields,
  submitButtonLabel,
  onSubmit,
}: {
  onClose: () => void;
  title: string;
  fields: Fields;
  submitButtonLabel: string;
  onSubmit: (values: any) => Promise<void>;
}) => {
  const initialValues = useMemo(() => {
    return fields.reduce((acc, field) => {
      if (Array.isArray(field)) {
        return {
          ...acc,
          ...field.reduce(
            (acc, field) => ({ ...acc, [field.name]: field.defaultValue }),
            {}
          ),
        };
      }
      return { ...acc, [field.name]: field.defaultValue };
    }, {});
  }, [fields]);

  return (
    <TailwindPlusModal
      close={onClose}
      width={40}
      height={50}
      className="border-4 border-blue-600 p-0 rounded-[10px]"
      rounded={false}
    >
      <div className="bg-blue-600 text-xl text-white font-bold p-4">
        {title}
      </div>
      <div className="p-4">
        <Formik
          initialValues={initialValues}
          onSubmit={async (values) => {
            await onSubmit(values);
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
  const { label, name, type } = field;
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={name} className="text-sm text-black font-bold">
          {label}
        </label>
      )}
      <Field
        name={name}
        className="border-2 border-gray-300 rounded-md p-2 w-full resize-none"
        as={type === "textarea" ? "textarea" : "input"}
      />
    </div>
  );
};
