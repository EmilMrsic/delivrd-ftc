import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText } from "lucide-react";
import { ActivityLog } from "@/types";

type ActivityLogProps = {
  activityLog: ActivityLog;
};

const ActivityLogSection = ({ activityLog }: ActivityLogProps) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
        <CardTitle className="flex items-center">
          <FileText className="mr-2" /> Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="space-y-4">
          {activityLog.map((activity, index) => {
            return (
              <li key={index} className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-orange-500 z-10 mr-4 mt-1.5"></div>
                <div className="flex-grow">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{activity.time}</span>
                    <br />
                    <span className="text-xs text-gray-400">
                      {activity.day}
                    </span>
                    <br />
                    {activity.user}: {activity.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ActivityLogSection;
