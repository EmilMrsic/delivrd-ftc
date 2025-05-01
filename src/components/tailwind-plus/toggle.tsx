import { Switch } from "@headlessui/react";
import { useState } from "react";

export const TailwindPlusToggle = ({
  label,
  onToggle,
  checked,
}: {
  label?: string;
  onToggle?: (toggle: boolean) => void;
  checked?: boolean;
}) => {
  const [enabled, setEnabled] = useState(checked ?? false);
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        onChange={(toggle) => {
          console.log("okay got here", onToggle);
          setEnabled(toggle);
          if (onToggle) {
            onToggle?.(toggle);
          }
        }}
        className={`${
          enabled ? "bg-blue-600" : "bg-gray-200"
        } relative inline-flex h-6 w-11 items-center rounded-full`}
      >
        <span
          className={`${
            enabled ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
        />
      </Switch>
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
};
