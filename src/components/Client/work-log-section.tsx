import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Paperclip, Edit3, Save, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/utils";

interface WorkLog {
  id: string;
  user: string;
  content: string;
  attachments: string[];
  negotiation_id: string;
  timestamp: string;
}

interface WorkLogSectionProps {
  user: any;
  negotiationId: string | null;
}

const WorkLogSection: React.FC<WorkLogSectionProps> = ({
  user,
  negotiationId,
}) => {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);

  const fetchWorkLogs = async () => {
    if (!negotiationId) return;
    const logsRef = collection(db, "work_log");
    const logsQuery = query(
      logsRef,
      where("negotiation_id", "==", negotiationId)
    );
    const logsSnap = await getDocs(logsQuery);
    const logsData = logsSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as WorkLog)
    );
    setWorkLogs(logsData);
  };

  useEffect(() => {
    fetchWorkLogs();
  }, [negotiationId]);

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
        <CardTitle className="flex items-center">
          <FileText className="mr-2" /> Work Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
          {workLogs
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .map((log) => (
              <div key={log.id} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profile_pic} alt={user.name[0]} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-gray-100 flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{log.user}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <div
                      dangerouslySetInnerHTML={{ __html: log.content }}
                    ></div>
                  </div>
                  <div className="flex space-x-4 mt-2">
                    {log.attachments.map((file, i) => {
                      const isImage = [
                        "jpg",
                        "jpeg",
                        "png",
                        "gif",
                        "bmp",
                        "webp",
                      ].some((ext) => file.toLowerCase().includes(ext));
                      return (
                        <div key={i} className="relative w-20 h-20">
                          <div
                            onClick={() => window.open(file, "_blank")}
                            className="cursor-pointer w-full h-full flex items-center justify-center rounded-md overflow-hidden"
                          >
                            {isImage ? (
                              <img
                                src={file}
                                alt="Uploaded file"
                                className="object-cover w-full h-full z-[0]"
                              />
                            ) : (
                              <embed
                                type="application/pdf"
                                width="100%"
                                height="100%"
                                className="z-[0]"
                                src={file}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkLogSection;
