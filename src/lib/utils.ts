import { Color } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseColorOptions(colorOptions: string): {
  exteriorColors: Color[];
  interiorColors: Color[];
} {
  const exteriorSectionRegex = /Exterior\n([\s\S]*?)\n\s*Interior\n/;
  const interiorSectionRegex = /Interior\n([\s\S]*)\n/;

  const exteriorMatch = colorOptions.match(exteriorSectionRegex);
  const interiorMatch = colorOptions.match(interiorSectionRegex);

  function parseColors(section: string | null): Color[] {
    if (!section) return [];

    const unwantedCharRegex = /^[^\p{L}]+/u;

    return section
      .trim()
      .split("\n")
      .map((line) => {
        const isPreferred = line.startsWith("👍");
        // Remove any unwanted characters or emojis at the start
        const cleanedColorName = line.replace(unwantedCharRegex, "").trim();

        return {
          name: cleanedColorName,
          preferred: isPreferred,
        };
      })
      .filter((color) => color.name); // Filter out any empty color names
  }

  return {
    exteriorColors: exteriorMatch ? parseColors(exteriorMatch?.[1]) : [],
    interiorColors: interiorMatch ? parseColors(interiorMatch?.[1]) : [],
  };
}
