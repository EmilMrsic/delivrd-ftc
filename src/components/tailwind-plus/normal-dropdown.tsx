import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const NormalDropdown = ({
  options,
  default: defaultValue,
  onChange,
  className,
  maxDisplayChars,
}: {
  options: (string | ({ key: string; value: any } & any))[];
  default: any;
  onChange: (value: any) => void;
  className?: string;
  maxDisplayChars?: number;
}) => {
  const [selectedValue, setSelectedValue] = useState<any>(defaultValue);

  useEffect(() => {
    onChange(selectedValue);
  }, [selectedValue]);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          {selectedValue instanceof Object ? selectedValue.key : selectedValue}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option, idx) => (
          <DropdownMenuCheckboxItem
            key={option instanceof Object ? option.key : option}
            checked={selectedValue === option}
            onCheckedChange={() => setSelectedValue(option)}
          >
            {option instanceof Object ? option.key : option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
