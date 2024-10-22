import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectProfileProps {
  name: string;
  description: string;
  status: "Active" | "Completed" | "On Hold";
  manager: {
    name: string;
    avatar: string;
  };
  team: Array<{
    name: string;
    avatar: string;
  }>;
  startDate: string;
  endDate: string;
}

export default function ProjectProfile({
  name,
  description,
  status,
  manager,
  team,
  startDate,
  endDate,
}: ProjectProfileProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">{name}</CardTitle>
          <Badge
            variant={
              status === "Active"
                ? "default"
                : status === "Completed"
                ? "secondary"
                : "outline"
            }
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-2">Project Manager</h3>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={manager.avatar} alt={manager.name} />
                <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{manager.name}</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Team Members</h3>
            <div className="flex -space-x-2">
              {team.map((member, index) => (
                <Avatar key={index} className="border-2 border-background">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Start Date</h3>
            <p>{startDate}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">End Date</h3>
            <p>{endDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
