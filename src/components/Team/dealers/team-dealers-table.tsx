import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { DealerDataType } from "@/lib/models/dealer";
import { MakeButton } from "../make-button";
import { RadiusButton } from "@/components/base/radius-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditableText } from "@/components/tailwind-plus/editable-text";
import { Form, Formik } from "formik";
import { MultiButtonSelect } from "@/components/tailwind-plus/form-widgets/multi-button-select";
import { negotiationMakeColors } from "@/lib/constants/negotiations";
import { canonicalizePhoneNumber } from "@/lib/helpers/etc";

export const TeamDealersTable = ({
  dealers,
  loading,
  sortConfig,
  setSortConfig,
  sortData,
  handleUpdate,
  refresh,
}: {
  dealers: DealerDataType[];
  loading: boolean;
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  handleUpdate: (id: string, key: string, value: any) => void;
  refresh: () => void;
}) => {
  return (
    <div>
      <TailwindPlusTable
        pagination={true}
        pageLimit={100}
        isLoading={loading}
        headers={[
          "Brand",
          {
            header: "City",
            config: {
              sortable: true,
              key: "City",
            },
          },
          {
            header: "State",
            config: {
              sortable: true,
              key: "State",
            },
          },
          {
            header: "Dealership",
            config: {
              sortable: true,
              key: "Dealership",
            },
          },
          {
            header: "Sales Person",
            config: {
              sortable: true,
              key: "SalesPersonName",
            },
          },
          {
            header: "Contact",
            config: {
              sortable: true,
              key: "SalesPersonPhone",
            },
          },
          {
            header: "Radius",
            config: {
              sortable: true,
              key: "radius",
            },
          },
          {
            header: "Number of Bids",
            config: {
              sortable: true,
              key: "bids",
            },
          },
          {
            header: "Last Bid",
            config: {
              sortable: true,
              key: "lastBid",
            },
          },
          "Actions",
        ]}
        rows={dealers.map((dealer) => [
          {
            Component: ({ expand }: any) => {
              return (
                <div onClick={expand}>
                  {dealer.Brand?.map((brand) => (
                    <MakeButton make={brand} />
                  ))}
                </div>
              );
            },
            config: {
              expandable: true,
              noExpandButton: true,
              noCloseButton: true,
              expandedComponent: ({ setExpanded }: any) => {
                return (
                  <Formik
                    initialValues={{ brand: dealer.Brand }}
                    onSubmit={(values) => {
                      handleUpdate(dealer.id, "Brand", values.brand);
                      setExpanded(null);
                      refresh();
                    }}
                  >
                    <Form>
                      <MultiButtonSelect
                        name="brand"
                        options={Object.entries(negotiationMakeColors).map(
                          ([key]) => ({
                            label: key,
                            value: key,
                          })
                        )}
                        multiple={true}
                        checkboxes={true}
                      />
                      <div className="w-full justify-end">
                        <Button
                          // variant="outline"
                          type="submit"
                          className="w-fit mr-0 ml-auto mt-4 bg-blue-500 text-white"
                        >
                          Save
                        </Button>
                      </div>
                    </Form>
                  </Formik>
                );
              },
            },
          },
          {
            Component: () => {
              return (
                <EditableText
                  value={dealer.City ?? ""}
                  onUpdate={(value) => {
                    handleUpdate(dealer.id, "City", value);
                    refresh();
                  }}
                  className="w-full"
                  noMaxWidth={true}
                />
              );
              // dealer.City ?? "";
            },
          },
          {
            Component: () => {
              return (
                <EditableText
                  value={dealer.State ?? ""}
                  onUpdate={(value) => {
                    handleUpdate(dealer.id, "State", value);
                    refresh();
                  }}
                  className="w-full"
                  noMaxWidth={true}
                />
              );
            },
          },
          {
            Component: () => {
              return (
                <EditableText
                  value={dealer.Dealership ?? ""}
                  onUpdate={(value) => {
                    handleUpdate(dealer.id, "Dealership", value);
                    refresh();
                  }}
                  className="w-full font-bold"
                  noMaxWidth={true}
                />
              );
            },
          },
          {
            Component: () => {
              return (
                <EditableText
                  value={dealer.SalesPersonName ?? ""}
                  onUpdate={(value) => {
                    handleUpdate(dealer.id, "SalesPersonName", value);
                    refresh();
                  }}
                  className="w-full"
                  noMaxWidth={true}
                />
              );
            },
          },
          {
            Component: () => (
              <EditableText
                value={canonicalizePhoneNumber(dealer.SalesPersonPhone ?? "")}
                className="text-blue-500 w-full"
                onUpdate={(value) => {
                  handleUpdate(dealer.id, "SalesPersonPhone", value);
                  refresh();
                }}
                noMaxWidth={true}
              />
            ),
          },
          {
            Component: ({ expand }: any) => (
              <div onClick={expand}>
                <RadiusButton radius={dealer.radius ?? ""} />
              </div>
            ),
            config: {
              expandable: true,
              expandedComponent: ({ setExpanded }: any) => {
                return (
                  <Formik
                    initialValues={{ radius: dealer.radius }}
                    onSubmit={(values: any) => {
                      handleUpdate(dealer.id, "radius", values.radius[0]);
                      setExpanded(null);
                      refresh();
                    }}
                  >
                    <Form>
                      <MultiButtonSelect
                        name="radius"
                        options={[
                          {
                            label: "50 Miles",
                            value: "50",
                          },
                          {
                            label: "100 Miles",
                            value: "100",
                          },
                          {
                            label: "250 Miles",
                            value: "250",
                          },
                          {
                            label: "Nationwide",
                            value: "nationwide",
                          },
                        ]}
                        onChange={(value: any) => {
                          console.log("got updated value", value);
                        }}
                      />
                      <div className="w-full justify-end">
                        <Button
                          type="submit"
                          className="w-fit mr-0 ml-auto mt-4 bg-blue-500 text-white"
                        >
                          Save
                        </Button>
                      </div>
                    </Form>
                  </Formik>
                );
              },
              noExpandButton: true,
              noCloseButton: true,
            },
          },
          {
            Component: ({ expand }: any) => (
              <Button
                // onClick={expand}
                className="bg-green-500 text-white p-2 hover:bg-green-500"
              >
                {dealer.bids?.length?.toString() ?? "0"}
              </Button>
            ),
            config: {
              expandable: true,
              expandedComponent: ({ setExpanded }: any) => {
                return (
                  <div>
                    {dealer.bids?.map((bid: any) => {
                      console.log("bid", bid);
                      return (
                        <div key={bid.id}>
                          <div>{bid.id}</div>
                          <div>{bid.amount}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              },
              noExpandButton: true,
              noCloseButton: true,
            },
          },
          {
            Component: () =>
              dealer.lastBid ? (
                <Button variant="outline" className="text-xs" disabled>
                  {dealer.lastBid
                    ? new Date(dealer.lastBid).toLocaleDateString()
                    : ""}
                </Button>
              ) : (
                <></>
              ),
          },
          {
            Component: () => {
              return dealer.YourWebsite ? (
                <Link
                  href={dealer.YourWebsite}
                  target="_blank"
                  className="text-blue-500"
                >
                  Website
                </Link>
              ) : (
                "N/A"
              );
            },
          },
        ])}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        sortData={sortData}
      />
    </div>
  );
};
