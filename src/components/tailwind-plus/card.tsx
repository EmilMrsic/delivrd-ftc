import { cn } from "@/lib/utils";
import { Heading, Subheading } from "./text";
import { useIsMobile } from "@/hooks/useIsMobile";

export const TailwindPlusCard = ({
  children,
  className,
  title,
  icon,
  actions,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ComponentType;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => {
  const isMobile = useIsMobile();
  const Icon = icon;
  const Action = actions;

  return (
    <>
      <div
        className="-m-2 grid grid-cols-1 rounded-3xl ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md mb-4"
        onClick={onClick}
      >
        <div className="grid grid-cols-1 rounded-3xl p-2 shadow-md shadow-black/5">
          <div
            className={cn(
              `rounded-3xl bg-white pb-9 ring-1 shadow-2xl ring-black/5`,
              isMobile ? "p-4" : "p-10",
              className
            )}
          >
            <div
              className={cn(
                `items-center justify-between`,
                isMobile ? "" : "flex"
              )}
            >
              {title && (
                <Subheading
                  className="flex items-center mb-4"
                  size={isMobile ? "small" : "medium"}
                >
                  {Icon && <Icon className="mr-2" />} {title}
                </Subheading>
              )}
              {Action && (
                <div
                  className={cn(``, isMobile ? "mt-8 mb-8" : "mt-auto mb-auto")}
                >
                  <div className={cn(isMobile ? "" : "mt-[-20px]")}>
                    <Action />
                  </div>
                </div>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
