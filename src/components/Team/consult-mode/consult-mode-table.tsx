import { TailwindPlusExpandableTable } from "@/components/tailwind-plus/expandable-table";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { NegotiationDataType } from "@/lib/models/team";
import { StageDropdown } from "../stage-dropdown";
import { formatDateToLocal } from "@/lib/helpers/dates";
import { Button } from "@/components/ui/button";
import { ClientProfile } from "../profile/client-profile";
import { getStatusStyles } from "@/lib/utils";

// Parit: recAV4HHDm

export const ConsultModeTable = ({
  negotiationsByColumn,
  refetch,
  sortData,
  sortConfig,
  setSortConfig,
}: {
  negotiationsByColumn: {
    status: string;
    negotiations: NegotiationDataType[];
  }[];
  refetch: () => void;
  sortData: (key: string, direction: string) => void;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
}) => {
  return (
    <TailwindPlusExpandableTable
      defaultExpanded={[0]}
      rows={negotiationsByColumn.map((node, idx) => {
        const { status, negotiations } = node;
        return {
          title: status,
          Component: () => (
            <>
              <Button
                variant="outline"
                style={{
                  backgroundColor: getStatusStyles(status).backgroundColor,
                  color: getStatusStyles(status).textColor, // Set dynamic text color
                }}
                className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
              >
                <p>{status}</p>
              </Button>
              {negotiations.length}
            </>
          ),
          expandedComponent: () => (
            <TailwindPlusTable
              headers={[
                {
                  header: "Consult Date",
                  config: {
                    sortable: true,
                    key: "createdAt",
                  },
                },
                {
                  header: "First Name",
                  config: {
                    sortable: true,
                    key: "clientFirstName",
                  },
                },
                {
                  header: "Last Name",
                  config: {
                    sortable: true,
                    key: "clientLastName",
                  },
                },
                {
                  header: "Status",
                },
                {
                  header: "Email",
                  config: {
                    sortable: true,
                    key: "clientEmail",
                  },
                },
                {
                  header: "Trade",
                  config: {
                    sortable: true,
                    key: "tradeInInfo",
                  },
                },
                {
                  header: "Consult Notes",
                  config: {
                    sortable: true,
                    key: "consultNotes",
                  },
                },
                {
                  header: "Current Timeline",
                  config: {
                    sortable: true,
                    key: "purchaseTimeline",
                  },
                },
                {
                  header: "Previous Experience",
                  config: {
                    sortable: true,
                    key: "dealershipExperience",
                  },
                },
                {
                  header: "Source",
                  config: {
                    sortable: true,
                    key: "source",
                  },
                },
              ]}
              rows={negotiations.map((negotiation) => {
                return [
                  {
                    Component: () => (
                      <Button
                        variant="outline"
                        style={{
                          backgroundColor: "#e9f3e8",
                          // backgroundColor: getStatusStyles(deal?.stage ?? "").backgroundColor,
                          // color: getStatusStyles(deal?.stage ?? "").textColor, // Set dynamic text color
                        }}
                        className="p-1 w-fit h-fit text-xs border-gray-300"
                      >
                        {formatDateToLocal(new Date(negotiation.createdAt))}
                      </Button>
                    ),
                  },
                  {
                    text: negotiation.clientFirstName,
                    config: {
                      expandable: true,
                      expandedComponent: () => (
                        <ClientProfile
                          negotiationId={negotiation.id}
                          allowClientModeToggle={true}
                        />
                      ),
                      onExpandedClose: () => {
                        refetch();
                      },
                      expandedSize: "full",
                    },
                  },
                  negotiation.clientLastName,
                  {
                    Component: () => (
                      <StageDropdown
                        deal={negotiation}
                        onStageChange={(stage) => {
                          refetch();
                        }}
                        all={true}
                        // handleStageChange={handleStageChange}
                      />
                    ),
                    expandedComponent: () => (
                      <div>
                        <p>{negotiation.consultNotes}</p>
                      </div>
                    ),
                  },
                  negotiation.clientEmail,
                  negotiation.tradeInInfo,
                  negotiation.consultNotes,
                  {
                    Component: () =>
                      negotiation.purchaseTimeline && (
                        <Button
                          variant="outline"
                          style={{
                            backgroundColor: "#c5ebf7",
                          }}
                          className="p-1 w-fit h-fit text-xs border-gray-300"
                        >
                          {negotiation.purchaseTimeline}
                        </Button>
                      ),
                  },
                  {
                    Component: () =>
                      negotiation.dealershipExperience && (
                        <Button
                          variant="outline"
                          style={{
                            backgroundColor: "#c5ebf7",
                          }}
                          className="p-1 w-fit h-fit text-xs border-gray-300"
                        >
                          {negotiation.dealershipExperience}
                        </Button>
                      ),
                  },
                  negotiation.source,
                ];
              })}
              sortData={sortData}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
            />
          ),
        };
      })}
    />
  );
};
