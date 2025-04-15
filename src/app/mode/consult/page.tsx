"use client";
import { TeamHeader } from "@/components/base/header";
import { InputField } from "@/components/base/input-field";
import { ConsultModeTable } from "@/components/Team/consult-mode/consult-mode-table";
import { Card, CardContent } from "@/components/ui/card";
import { useNegotiations } from "@/hooks/useNegotiations";
import { DEFAULT_SORTED_COLUMN } from "@/lib/constants/negotiations";
import {
  mapNegotiationsByColumn,
  sortDataHelper,
  sortMappedDataHelper,
} from "@/lib/helpers/negotiation";
import { NegotiationDataType } from "@/lib/models/team";
import { useEffect, useMemo, useState } from "react";

// Consult Date (createdAt)
// First Name
// Last Name
// Status
// Email
// Trade
// Consult Notes
// Current Timeline to Buy a car
// Prevous Experience with Dealerships
// Source

export default function ConsultMode() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dayToSort = useMemo(() => {
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = selectedDate.getFullYear();
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const { negotiations, refetch } = useNegotiations({
    all: true,
    mode: "consult",
    filter: {
      createdAt: dayToSort,
    },
  });

  useEffect(() => {
    refetch(undefined, { createdAt: dayToSort });
  }, [dayToSort]);

  const [negotiationsByColumn, setNegotiationsByColumn] = useState<
    Record<string, NegotiationDataType[]>
  >({});

  useEffect(() => {
    if (negotiations) {
      const negotiationsByColumn = mapNegotiationsByColumn(
        negotiations,
        "stage"
      );
      setNegotiationsByColumn(negotiationsByColumn);
    }
  }, [negotiations]);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({
    key: "createdAt",
    direction: "desc",
  });

  const sortData = (key: string, direction: string) => {
    setSortConfig({ key, direction });
    setNegotiationsByColumn((prevState) => {
      const newState = { ...prevState };
      Object.keys(newState).forEach((status) => {
        const data = newState[status];
        const sortedData = sortDataHelper(data)(key, direction);
        newState[status] = sortedData as NegotiationDataType[];
      });
      return newState;
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <div className="relative z-[11]">
        <div className="w-[200px] mr-0 ml-auto">
          <InputField
            label="Consult Date"
            type="datePicker"
            dateFormat="MM-dd-yyyy"
            selected={selectedDate}
            value={selectedDate.toISOString()}
            onDateChange={(date) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
          />
        </div>
      </div>
      <Card className="bg-white shadow-lg">
        <CardContent>
          <ConsultModeTable
            negotiationsByColumn={negotiationsByColumn}
            refetch={refetch}
            sortData={sortData}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
          />
        </CardContent>
      </Card>
    </div>
  );
}
