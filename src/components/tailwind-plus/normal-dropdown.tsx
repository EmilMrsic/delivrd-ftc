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
}: {
  options: string[];
  default: string;
  onChange: (value: string) => void;
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

  useEffect(() => {
    onChange(selectedValue);
  }, [selectedValue]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{selectedValue}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selectedValue === option}
            onCheckedChange={() => setSelectedValue(option)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
