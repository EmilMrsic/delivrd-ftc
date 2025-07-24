import { TabsList } from "@radix-ui/react-tabs";
import { Tabs, TabsTrigger } from "../ui/tabs";

export const TabSelector = ({
  options,
  value,
  setValue,
}: {
  options: { [key: string]: string };
  value: string;
  setValue: (value: string) => void;
}) => {
  return (
    <div className="block md:bg-transparent bg-white md:border-none border-b top-[145px] md:pt-0 pt-8 md:static z-50">
      <Tabs
        className="md:text-start text-center mb-2"
        value={value}
        onValueChange={setValue}
      >
        <TabsList>
          {Object.entries(options).map(([key, value]) => (
            <TabsTrigger key={key} value={key}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
