export const ColorDisplayCard = ({
  desired,
  excluded,
  title,
}: {
  desired: string;
  excluded: string;
  title: string;
}) => {
  return (
    <div className="max-w-md rounded-md overflow-hidden border border-gray-200 shadow-sm font-sans">
      <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-800">
        {title}
      </div>
      <div className="p-4">
        {desired && (
          <div className="px-4 py-3 bg-green-50 text-green-700 text-sm border-b border-green-100">
            <div className="flex items-center">
              <span className="mr-2">✅</span>
              <span className="font-semibold">{desired}</span>
            </div>
          </div>
        )}
        {excluded && (
          <>
            <div className="text-xs font-bold uppercase mb-1 mt-2">
              Deal Breaker
            </div>
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
              <div className="flex items-center">
                <span className="mr-2">❌</span>
                <span>{excluded}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
