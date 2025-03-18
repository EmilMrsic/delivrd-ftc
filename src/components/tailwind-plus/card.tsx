import { Heading, Subheading } from "./text";

export const TailwindPlusCard = ({
  children,
  className,
  title,
  icon,
  actions,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ComponentType;
}) => {
  const Icon = icon;
  const Action = actions;
  return (
    <>
      <div className="-m-2 grid grid-cols-1 rounded-3xl ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md mb-4">
        <div className="grid grid-cols-1 rounded-3xl p-2 shadow-md shadow-black/5">
          <div className="rounded-3xl bg-white p-10 pb-9 ring-1 shadow-2xl ring-black/5">
            <div className="flex items-center justify-between">
              <Subheading className="flex items-center mb-4" size="medium">
                {Icon && <Icon className="mr-2" />} {title}
              </Subheading>
              {Action && (
                <div className="mb-auto mt-auto">
                  <div className="mt-[-20px]">
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
