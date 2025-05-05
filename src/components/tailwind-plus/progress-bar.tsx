export const TailwindPlusProgressBar = ({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) => {
  const width = (numerator / denominator) * 100;
  return (
    <div>
      {" "}
      <div className="overflow-hidden rounded-full bg-gray-200">
        <div
          style={{ width: `${width}%` }}
          className="h-2 rounded-full bg-[#5084da]"
        />
      </div>
    </div>
  );
};
