"use client";

import { useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { NegotiationData } from "@/types";
import { db } from "@/firebase/config";
import { Button } from "../ui/button";

type SearchAll = {
  setCurrentDeals: (item: NegotiationData[]) => void;
};

export default function SearchAll({ setCurrentDeals }: SearchAll) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const usersRef = collection(db, "negotiations");

      const searchPromises = [
        getDocs(
          query(
            usersRef,
            where("negotiations_First_Name", "==", searchQuery),
            limit(20)
          )
        ),
        getDocs(
          query(
            usersRef,
            where("negotiations_Last_Name", "==", searchQuery),
            limit(20)
          )
        ),
        getDocs(
          query(
            usersRef,
            where("negotiations_Email", "==", searchQuery),
            limit(20)
          )
        ),
        getDocs(
          query(
            usersRef,
            where("negotiations_Phone", "==", searchQuery),
            limit(20)
          )
        ),
      ];

      const snapshots = await Promise.all(searchPromises);

      // Avoid duplicate results by using a Set with unique IDs
      const uniqueResults = new Map();
      snapshots.forEach((snapshot) =>
        snapshot.docs.forEach((doc) =>
          uniqueResults.set(doc.id, { id: doc.id, ...doc.data() })
        )
      );

      setCurrentDeals(Array.from(uniqueResults.values()) as NegotiationData[]);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleSearchChange = (event: any) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          newDefault={true}
          variant="outline"
        >
          <p>Search</p>
        </Button>
      )}

      {isOpen && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            placeholder="Search by first name, last name, phone, or email"
            onChange={handleSearchChange}
            className="flex-1 p-1 border text-sm border-gray-300 rounded-md focus:outline-none"
          />
          <Button
            onClick={handleSearch}
            newDefault={true}
            variant={"outline"}
            className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
          >
            Search
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            newDefault={true}
            variant={"outline"}
            className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
