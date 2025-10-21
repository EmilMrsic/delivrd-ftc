import { Disclosure } from "@headlessui/react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Accordion = ({
  children,
  header: Header,
}: {
  children: React.ReactNode;
  header: () => React.ReactNode;
}) => {
  return (
    <Disclosure>
      {({ open, close }) => (
        <>
          <div className="flex">
            <Header />
            <div className="ml-auto mr-0 my-auto">
              <Disclosure.Button className="w-full text-left">
                {open ? <ChevronUp /> : <ChevronDown />}
              </Disclosure.Button>
            </div>
          </div>
          <Disclosure.Panel unmount={false}>{children}</Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
