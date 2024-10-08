"use client";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Header from "./header";
import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  addDoc,
} from "firebase/firestore";
import VehicleCard from "./vehicle-card";
import { db, storage } from "@/firebase/config";
import { IUser, Vehicle } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { parseColorOptions } from "@/lib/utils";
import Image from "next/image";
import { Loader } from "./loader";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function BiddingSection() {
  const { toast } = useToast();
  const [showSelected, setShowSelected] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bidVehicles, setBidVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [filteredBidVehicles, setFilteredBidVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("available");
  const [subTab, setSubTab] = useState("all");

  const [user, setUser] = useState<null | IUser>(null);

  const toggleVehicleSelection = (id: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `uploads/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("File available at:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const submitBid = async (
    vehicleId: string,
    price: string,
    message: string,
    discountPrice: string,
    inventoryStatus: string,
    files: FileList | null
  ) => {
    if (!user) {
      toast({
        title: "You must be logged in to submit a bid.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      let fileUrls: string[] = [];
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const uploadPromises = fileArray.map((file) => uploadFile(file));
        fileUrls = (await Promise.all(uploadPromises)).filter(
          Boolean
        ) as string[];
      }
      // Change this line to use addDoc instead of setDoc
      const bidRef = collection(db, "Incoming Bids");
      await addDoc(bidRef, {
        dealerId: user.id,
        clientId: vehicleId,
        price: parseFloat(price),
        comments: message,
        files: fileUrls,
        timestamp: serverTimestamp(),
        discountPrice: discountPrice,
        inventoryStatus: inventoryStatus,
      });

      toast({
        title: "Bid submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "There was an error submitting your bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    const parsedUser = user && JSON.parse(user);
    setUser(parsedUser);
  }, []);

  const fetchVehicles = async () => {
    const user = localStorage.getItem("user");
    const parsedUser = user && JSON.parse(user);

    try {
      if (parsedUser && parsedUser.brand) {
        setLoading(true);
        const clientQuery = query(collection(db, "Clients"));

        const querySnapshot = await getDocs(clientQuery);
        const vehicleData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const colorOptions = data.ColorOptions || "";
          const { exteriorColors, interiorColors } =
            parseColorOptions(colorOptions);
          return {
            id: doc.id,
            name: data.Model || "Unknown Model",
            brand: data.Brand || "Unknown Brand",
            isNew: data.NewOrUsed === "New",
            zipCode: data.ZipCode || "",
            trim: data.Trim || "",
            exteriorColors,
            interiorColors,
            drivetrain: data.Drivetrain || "Unknown",
            createdAt: data.createdAt,
          };
        });

        //get all the bids submitted by the logged in user
        const incomingBidQuery = query(
          collection(db, "Incoming Bids"),
          where("dealerId", "==", parsedUser.id)
        );
        const bidQuerySnapshot = await getDocs(incomingBidQuery);
        const bidVehicleClientIds = bidQuerySnapshot.docs.map((doc) => {
          const data = doc.data();
          return data.clientId;
        });

        const bidData: Vehicle[] = bidQuerySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            price: data.price ?? 0,
            discountPrice: data.discountPrice ?? 0,
            inventoryStatus: data.inventoryStatus ?? "",
            notes: data.comments ?? "",
            files: data.files || [],
            client: data.clientId || "",
          };
        });

        //filter vehicles for which we've already bid
        const filteredBidVehicles = vehicleData.filter((data) => {
          return bidVehicleClientIds.includes(data.id);
        });

        const filteredBidData: Vehicle[] = bidData.map((data) => {
          const matchedVehicle = filteredBidVehicles.find(
            (vehicle) => vehicle.id === data.client
          );

          if (matchedVehicle) {
            const { brand, name, trim } = matchedVehicle;
            return {
              ...data,
              carMake: brand ?? "Unknown Make",
              carModel: name ?? "Unknown Model",
              trim: trim ?? "Unknown Trim",
            };
          }

          return data;
        });

        const filteredNonBidVehicles = vehicleData.filter((data) => {
          return !bidVehicleClientIds.includes(data.id);
        });

        //setting bidvehicles
        setBidVehicles(filteredBidData);
        setFilteredBidVehicles(filteredBidData);

        //setting unbidVehicles
        setVehicles(filteredNonBidVehicles);
        setFilteredVehicles(filteredNonBidVehicles);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (tab === "available") {
      const filteredSelectedVehicles = showSelected
        ? vehicles.filter((v) => selectedVehicles.includes(v.id || ""))
        : vehicles;

      setFilteredVehicles(filteredSelectedVehicles);
    } else {
      const filteredSelectedVehicles = showSelected
        ? bidVehicles.filter((v) => selectedVehicles.includes(v.id || ""))
        : bidVehicles;

      setFilteredBidVehicles(filteredSelectedVehicles);
    }
  }, [showSelected]);

  useEffect(() => {
    setFilteredBidVehicles(bidVehicles);
    setFilteredVehicles(vehicles);
    setSelectedVehicles([]);
  }, [tab]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const parsedUser = user && JSON.parse(user);
    const filterVehicles = () => {
      switch (subTab) {
        case "all":
          return vehicles.filter((vehicle) => {
            if (vehicle.isNew) {
              if (Array.isArray(parsedUser.brand)) {
                return parsedUser.brand.includes(vehicle.brand);
              } else {
                return vehicle.brand === parsedUser.brand;
              }
            } else {
              return !vehicle.isNew;
            }
          });
        case "new":
          return vehicles.filter((vehicle) => {
            if (vehicle.isNew && Array.isArray(parsedUser.brand)) {
              if (parsedUser.brand.includes(vehicle.brand)) return vehicle;
            } else {
              vehicle.brand === parsedUser.brand && vehicle.isNew && vehicle;
            }
          });
        case "used":
          return vehicles.filter((vehicle) => !vehicle.isNew);
        default:
          return vehicles;
      }
    };
    setFilteredVehicles(filterVehicles());
  }, [subTab, vehicles]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <Tabs
          value={tab}
          defaultValue="account"
          className="w-[400px] mb-2"
          onValueChange={(value) => setTab(value)}
        >
          <TabsList>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="previous">Previous Bids</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-between mb-8">
          <div className="text-lg font-semibold">
            Selected Vehicles:{" "}
            <span className="text-primary">{selectedVehicles.length}</span>
          </div>
          <div className="space-x-1">
            <div className="flex items-center">
              {tab == "available" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showSelected"
                    checked={showSelected}
                    onCheckedChange={() => setShowSelected(!showSelected)}
                  />
                  <Label
                    htmlFor="showSelected"
                    className="text-sm font-medium "
                  >
                    Show only selected vehicles
                  </Label>
                </div>
              )}
              <div>
                <Tabs
                  value={subTab}
                  defaultValue="all"
                  className="ml-8"
                  onValueChange={(value) => setSubTab(value)}
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="new">New</TabsTrigger>
                    <TabsTrigger value="used">Used</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <>
            {tab == "available" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles?.map((vehicle, index) => (
                  <VehicleCard
                    key={`vehicle-card-${vehicle.id}-${index}`}
                    vehicle={vehicle}
                    selectedVehicles={selectedVehicles}
                    toggleVehicleSelection={toggleVehicleSelection}
                    submitBid={submitBid}
                  />
                ))}
              </div>
            ) : (
              <Table className="">
                <TableCaption>A list of your recent bids.</TableCaption>
                <TableHeader className="bg-[#ebeaea]">
                  <TableRow>
                    <TableHead className="text-left">Make</TableHead>
                    <TableHead className="text-left">Model</TableHead>
                    <TableHead className="text-left">Trim</TableHead>
                    <TableHead className="text-left">Price</TableHead>
                    <TableHead className="text-left">
                      Discounted Price
                    </TableHead>
                    <TableHead className="text-left">
                      Inventory Status
                    </TableHead>
                    <TableHead className="text-left">
                      Additional comments
                    </TableHead>
                    <TableHead className="text-left">Files</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBidVehicles.map((bid, index) => (
                    <TableRow key={"filteredBidVehicles_" + index}>
                      <TableCell className="font-medium">
                        {bid.carMake}
                      </TableCell>
                      <TableCell className="font-medium">
                        {bid.carModel}
                      </TableCell>
                      <TableCell className="font-medium">{bid.trim}</TableCell>
                      <TableCell>{bid.price}</TableCell>
                      <TableCell>{bid.discountPrice}</TableCell>
                      <TableCell>{bid.inventoryStatus}</TableCell>
                      <TableCell>{bid.notes}</TableCell>
                      <TableCell className="text-left">
                        {bid.files?.map((file: string, index) => {
                          return (
                            <Link
                              key={"bidFiles" + index}
                              href={file}
                              target="_blank"
                            >
                              <Image
                                src={file}
                                width={100}
                                height={100}
                                alt="Attachments"
                                className="transition-opacity duration-300 ease-in-out hover:opacity-50 rounded-lg"
                              />
                            </Link>
                          );
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </main>
    </div>
  );
}
