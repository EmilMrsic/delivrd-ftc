import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DatePickerCellProps {
  initialDate: string; // Expected format: "yyyy-MM-dd"
  onDateChange: (date?: string) => void;
}

const DatePickerCell = ({ initialDate, onDateChange }: DatePickerCellProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );
  const [isEditing, setIsEditing] = useState(false);

  const formatDateToLocal = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const day = String(date.getDate()).padStart(2, "0");

      return `${month}-${day}-${year}`; // Format as yyyy-MM-dd
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      onDateChange(formatDateToLocal(date)); // Format as "yyyy-MM-dd"
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (!initialDate) setSelectedDate(null);
  }, [initialDate]);

  return (
    <div className="relative">
      <DropdownMenu open={isEditing} onOpenChange={setIsEditing}>
        <DropdownMenuTrigger asChild>
          <button
            className="cursor-pointer rounded-lg border-1 p-1 w-fit h-fit text-xs bg-gray-300 text-gray-800 border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing); // Toggle dropdown visibility
            }}
          >
            {formatDateToLocal(selectedDate) || "TBD"}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="w-66 h-auto p-2"
        >
          {isEditing && (
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              inline
              onClickOutside={(e) => e.stopPropagation()}
              onBlur={(e) => {
                e.stopPropagation();
                setIsEditing(false);
              }}
              calendarClassName="z-[99]"
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DatePickerCell;
