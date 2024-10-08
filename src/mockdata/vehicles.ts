import { Vehicle } from "@/types";

export const vehicles: Vehicle[] = [
  {
    id: "1",
    name: "Toyota 4 Runner",
    brand: "Toyota",
    isNew: true,
    zipCode: "94806",
    trim: "TRD Off-Road Premium, Underground color, with KDSS, Moonroof and Off Road Premium Plus Package",
    exteriorColors: [
      { name: "Underground", preferred: true },
      { name: "Midnight Black", preferred: false },
      { name: "Ice Cap", preferred: false },
      { name: "Solar Octane", preferred: false },
      { name: "Nautical Blue", preferred: false },
      { name: "Barcelona Red", preferred: false },
    ],
    interiorColors: [{ name: "Black", preferred: true }],
    drivetrain: "4 Wheel",
  },
  {
    id: "2",
    name: "Honda Civic",
    brand: "Honda",
    isNew: false,
    zipCode: "90210",
    trim: "Sport Touring, Sonic Gray Pearl, with Honda Sensing",
    exteriorColors: [
      { name: "Sonic Gray Pearl", preferred: true },
      { name: "Crystal Black Pearl", preferred: true },
      { name: "Rallye Red", preferred: false },
    ],
    interiorColors: [
      { name: "Black Leather", preferred: true },
      { name: "Ivory Leather", preferred: false },
    ],
    drivetrain: "Front Wheel Drive",
  },
  {
    id: "3",
    name: "Ford F-150",
    brand: "Ford",
    isNew: true,
    zipCode: "48226",
    trim: "Lariat, Antimatter Blue, with 502A High Package",
    exteriorColors: [
      { name: "Antimatter Blue", preferred: true },
      { name: "Agate Black", preferred: true },
      { name: "Iconic Silver", preferred: false },
    ],
    interiorColors: [
      { name: "Black Leather", preferred: true },
      { name: "Medium Light Slate", preferred: false },
    ],
    drivetrain: "4x4",
  },
];
