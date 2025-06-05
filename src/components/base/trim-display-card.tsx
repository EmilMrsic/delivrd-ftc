export const TrimDisplayCard = ({ trim }: { trim: string }) => {
  return (
    <div className="max-w-md rounded-md border border-gray-200 shadow-sm font-sans">
      <div className="px-4 py-3 flex items-center space-x-2">
        <span className="text-gray-500">⚙️</span>
        <span className="font-semibold text-gray-900">Drivetrain</span>
      </div>
      <div className="px-4 pb-3">
        <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-md">
          {trim}
        </span>
      </div>
    </div>
  );
};
