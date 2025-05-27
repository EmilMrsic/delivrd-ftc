"use client";
import { TeamHeader } from "@/components/base/header";
import { TailwindPlusInput } from "@/components/tailwind-plus/input";
import { TeamDealersTable } from "@/components/Team/dealers/team-dealers-table";
import { Card, CardContent } from "@/components/ui/card";
import { useDealers } from "@/hooks/useDealers";
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealerDataType } from "@/lib/models/dealer";
import { useEffect, useState } from "react";
// https://www.loom.com/share/37d65d8ac41d4db097cbca896775ca29

const useDealersTable = ({ query }: { query: string }) => {
  const [useableQuery, setUseableQuery] = useState("");
  const [filteredDealers, setFilteredDealers] = useState<DealerDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const { dealers } = useDealers({
    all: true,
  });
  const [sortConfig, setSortConfig] = useState({
    key: "lastBid", // default sorting by Submitted Date
    direction: "ascending", // default direction
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
  const sortData = (key: string, direction: string) => {};

  useEffect(() => {
    if (dealers) {
      const filtered = dealers.filter((dealer: DealerDataType) => {
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

      setFilteredDealers(filtered);
      setLoading(false);
    }
  }, [dealers, useableQuery]);

  useEffect(() => {
    setLoading(true);
    setUseableQuery(query);
  }, [query]);

  return {
    dealers: filteredDealers,
    loading,
    sortConfig,
    setSortConfig,
    sortData,
  };
};

export default function FTCTable() {
  const [query, setQuery] = useState("");
  const { dealers, loading, setSortConfig, sortConfig, sortData } =
    useDealersTable({
      query,
    });

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
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
