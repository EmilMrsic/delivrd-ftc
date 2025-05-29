"use client";
import { TeamHeader } from "@/components/base/header";
import { TailwindPlusInput } from "@/components/tailwind-plus/input";
import { TeamDealersTable } from "@/components/Team/dealers/team-dealers-table";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/firebase/config";
import { useDealers } from "@/hooks/useDealers";
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealerDataType } from "@/lib/models/dealer";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
// https://www.loom.com/share/37d65d8ac41d4db097cbca896775ca29

const useDealersTable = ({ query }: { query: string }) => {
  const [useableQuery, setUseableQuery] = useState("");
  const [filteredDealers, setFilteredDealers] = useState<DealerDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const { dealers, refresh, isLoading } = useDealers({
    all: true,
  });
  const [initialLoad, setInitialLoad] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    key: "lastBid", // default sorting by Submitted Date
    direction: "descending", // default direction
  });

  // const sortData = (key: string, direction: string) => {
  //   setSortConfig((prevConfig) => {
  //     const sortedNegotiations = sortDataHelper( ?? [])(
  //       key,
  //       direction
  //     );

  //     return { key, direction: direction };
  //   });
  // };

  const sortDataHelper = (dealers: any, key: string, direction: string) => {
    return dealers.sort((a, b) => {
      const aValue = a[key as keyof DealerDataType];
      const bValue = b[key as keyof DealerDataType];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle array values (like Brand)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aStr = aValue.join(" ");
        const bStr = bValue.join(" ");
        return direction === "ascending"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "ascending" ? aValue - bValue : bValue - aValue;
      }

      // Default case - convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      return direction === "ascending"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  const sortData = (key: string, direction: string) => {
    const sorted = sortDataHelper(filteredDealers, key, direction);
    setFilteredDealers(sorted);
    setSortConfig((prevConfig) => {
      return { key, direction: direction };
    });
  };

  useEffect(() => {
    if (dealers) {
      let filtered = dealers.filter((dealer: DealerDataType) => {
        if (query === "") {
          if (dealer.updated) {
            return true;
          }
        } else {
          const searchIndex = `${dealer.Dealership} ${
            dealer.City
          } ${dealer.Brand?.join(" ")} ${dealer.SalesPersonName}`.toLowerCase();
          return searchIndex.includes(query.toLowerCase());
        }
      });

      if (initialLoad) {
        setInitialLoad(false);
        filtered = sortDataHelper(
          filtered,
          sortConfig.key,
          sortConfig.direction
        );
      }

      setFilteredDealers(filtered);
      setLoading(false);
    }
  }, [dealers, useableQuery, isLoading]);

  useEffect(() => {
    setLoading(true);
    setUseableQuery(query);
  }, [query]);

  const handleUpdate = (id: string, key: string, value: any) => {
    const newDealerTable = collection(db, "delivrd_dealers");
    const oldDealerTable = collection(db, "Dealers");

    const newDealer = doc(newDealerTable, id);
    const oldDealer = doc(oldDealerTable, id);

    updateDoc(newDealer, {
      [key]: value,
    });
    updateDoc(oldDealer, {
      [key]: value,
    });
  };

  return {
    dealers: filteredDealers,
    loading,
    sortConfig,
    setSortConfig,
    sortData,
    handleUpdate,
    refresh,
  };
};

export default function FTCTable() {
  const [query, setQuery] = useState("");
  const {
    dealers,
    loading,
    setSortConfig,
    sortConfig,
    sortData,
    handleUpdate,
    refresh,
  } = useDealersTable({
    query,
  });

  console.log("dealers:", dealers);

  if (!dealers) {
    return <div>loading...</div>;
  }

  return (
    <div className="mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <Card className="bg-white shadow-lg">
        <TailwindPlusInput
          placeholder="Search by dealership, city, brand or salesperson name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <CardContent>
          {!loading && (
            <TeamDealersTable
              dealers={dealers}
              loading={loading}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              sortData={sortData}
              handleUpdate={handleUpdate}
              refresh={refresh}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
