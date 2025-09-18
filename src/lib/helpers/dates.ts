import { format, toZonedTime } from "date-fns-tz";
import { isSameWeek } from "date-fns";

export const formatDateToLocal = (date: Date | null) => {
  if (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, "0");

    return `${month}-${day}-${year}`; // Format as yyyy-MM-dd
  }
};

export const dateFormat = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

export const isSameDay = (date1: Date, date2: Date) => {
  if (!date1 || !date2) return false;

  // Convert both dates to Eastern Time
  // const estDate1 = dateToTimeZone(date1);
  // const estDate2 = dateToTimeZone(date2);

  // // Compare year, month, and day components in Eastern Time
  // return (
  //   estDate1.getFullYear() === estDate2.getFullYear() &&
  //   estDate1.getMonth() === estDate2.getMonth() &&
  //   estDate1.getDate() === estDate2.getDate()
  // );

  // if (date1.toISOString().includes("6-10")) {
  // }

  return formatDateToTimezone(date1) === formatDateToTimezone(date2);
};

export const isThisMonth = (date: Date) => {
  if (!date) return false;
  // Convert dates to Eastern Time
  const estNow = dateToTimeZone(new Date());
  const estDate = dateToTimeZone(date);

  // Extract year and month from the EST dates
  const estNowYear = estNow.getFullYear();
  const estNowMonth = estNow.getMonth();

  // Check if the date falls within the same year and month in EST
  return (
    estDate.getFullYear() === estNowYear && estDate.getMonth() === estNowMonth
  );

  // if (!date) return false;

  // const now = dateToTimeZone(new Date());

  // Compare year and month in Eastern Time
  // return dateYear === nowYear && dateMonth === nowMonth;
  // const useableDate = date ? dateToTimeZone(date) : null;

  // const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // return (
  //   useableDate && useableDate >= startOfMonth && useableDate < startOfNextMonth
  // );
};

// check if the date this week, including sunday
export const isThisWeek = (date: Date) => {
  if (!date) return false;

  // Convert both dates to Eastern Time
  const estNow = dateToTimeZone(new Date());
  const estDate = dateToTimeZone(date);

  // Use date-fns to check if they're in the same week
  return isSameWeek(estDate, estNow, { weekStartsOn: 0 });
  // const now = new Date();
  // const lastSaturday = new Date();
  // lastSaturday.setDate(now.getDate() - now.getDay() - 1);
  // const nextSunday = new Date();
  // nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  // return date >= lastSaturday && date <= nextSunday;
};

export const dateTimeFormatter = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return formatter;
};

export const dateToTimeZone = (date: Date) => {
  return toZonedTime(date, "America/New_York");
};

export const formatDateToTimezone = (date: Date) => {
  return format(date, "yyyy-MM-dd", { timeZone: "America/New_York" });
};
