import { Heading } from "./text";

export const TailwindPlusCard = ({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) => {
  return (
    <>
      <div className="-m-2 grid grid-cols-1 rounded-3xl ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md mb-4">
        <div className="grid grid-cols-1 rounded-3xl p-2 shadow-md shadow-black/5">
          <div className="rounded-3xl bg-white p-10 pb-9 ring-1 shadow-2xl ring-black/5">
            <Heading>{title}</Heading>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
