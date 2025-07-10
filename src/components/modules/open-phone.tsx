import { Loader2, Phone } from "lucide-react";
import { TailwindPlusCard } from "../tailwind-plus/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backendRequest } from "@/lib/request";
import { cn } from "@/lib/utils";
import { Field, Form, Formik } from "formik";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";

export const OpenPhoneModule = ({
  negotiationId,
}: {
  negotiationId: string;
}) => {
  const ref = useRef();
  const [messages, setMessages] = useState<any[]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ["open-phone", negotiationId],
    queryFn: async () => {
      const result = await backendRequest(
        `openphone/get-messages/${negotiationId}`,
        "GET"
      );
      return result;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      console.log("in mutation", message);
      const result = await backendRequest(`openphone/send-message`, "POST", {
        message,
      });
      return result;
    },
  });

  useEffect(() => {
    if (data) {
      setMessages(data.messages);
    }
  }, [data]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    console.log("found ref:", ref);
    if (ref.current) {
      console.log("updating with ref:");
      ref.current.scrollTop = ref.current.scrollHeight;
      //   ref.current.focus();
    }
  }, [ref.current]);

  //   console.log("data:", data.messages);

  return (
    <TailwindPlusCard title="Open Phone" icon={Phone}>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div
            className="h-[500px] overflow-y-auto overflow-x-hidden"
            ref={ref}
          >
            {data.messages.map((message: any) => {
              return (
                <div
                  className={cn(
                    `border border-gray-200 p-2 mb-2 rounded-md w-[60%]`,
                    message.direction === "outgoing"
                      ? "bg-blue-300 text-white mr-0 ml-auto"
                      : "bg-gray-100 text-black ml-0 mr-auto"
                  )}
                >
                  <p>{message.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Formik
              initialValues={{ message: "" }}
              onSubmit={async (values, { setFieldValue }) => {
                setMessages([
                  ...messages,
                  {
                    text: values.message,
                    direction: "outgoing",
                  },
                ]);
                setFieldValue("message", "");

                const result = await sendMessage.mutateAsync(values.message);
              }}
            >
              <Form className="flex gap-2">
                {/* <Input type="textarea" name="message" /> */}
                <Field
                  name="message"
                  as="textarea"
                  className="border-2 border-gray-300 rounded-md p-2 w-full resize-none"
                />
                <Button type="submit">Send</Button>
              </Form>
            </Formik>
          </div>
        </>
      )}
    </TailwindPlusCard>
  );
};
