"use client";
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
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import "react-quill/dist/quill.snow.css";
import { toast } from "@/hooks/use-toast";
import { generateRandomId, uploadFile } from "@/lib/utils";
import { TailwindPlusCard } from "../tailwind-plus/card";
import { WorkLogType } from "@/lib/models/team";

interface WorkLogSectionProps {
  user: any;
  negotiationId: string | null;
  noActions?: boolean;
  clientMode?: boolean;
}

const WorkLogSection: React.FC<WorkLogSectionProps> = ({
  user,
  negotiationId,
  noActions = false,
  clientMode = false,
}) => {
  const [workLogs, setWorkLogs] = useState<WorkLogType[]>([]);
  const [newWorkLog, setNewWorkLog] = useState<string>("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [editFiles, setEditFiles] = useState<File[]>([]);

  const fetchWorkLogs = async (id: string | null) => {
    if (!id) return;

    try {
      const negotiationRef = doc(db, "delivrd_negotiations", id);
      const negotiationSnap = await getDoc(negotiationRef);

      if (negotiationSnap.exists()) {
        const data = negotiationSnap.data();
        const logsData = (data.workLogs || []) as WorkLogType[];
        setWorkLogs(logsData);
      } else {
        console.warn("Negotiation not found with id:", id);
        setWorkLogs([]);
      }
    } catch (error) {
      console.error("Error fetching work logs:", error);
      setWorkLogs([]);
    }
  };

  const startEditing = (log: WorkLogType) => {
    setEditingLog(log.id);
    setEditContent(log.content);
    setEditAttachments([...(log?.attachments || [])]);
    setEditFiles([]);
  };

  const saveEdit = async (negotiationId: string | null, logId: string) => {
    try {
      // Step 1: Fetch the negotiation document from Firestore
      const negotiationRef = doc(
        db,
        "delivrd_negotiations",
        negotiationId ?? ""
      );
      const negotiationSnap = await getDoc(negotiationRef);

      if (!negotiationSnap.exists()) {
        console.error("No negotiation found with ID:", negotiationId);
        toast({
          title: "Error: Negotiation not found",
          variant: "destructive",
        });
        return;
      }

      const negotiationData = negotiationSnap.data();
      const existingWorkLogs = negotiationData.workLogs || [];

      // Step 2: Find the specific work log inside the workLogs array
      const workLogIndex = existingWorkLogs.findIndex(
        (log: any) => log.id === logId
      );
      if (workLogIndex === -1) {
        console.error("No work log found with ID:", logId);
        toast({ title: "Error: Work log not found", variant: "destructive" });
        return;
      }

      // Step 3: Upload new files and get URLs
      const uploadedFiles = await Promise.all(
        editFiles.map(async (file) => {
          try {
            return await uploadFile(file);
          } catch (error) {
            console.error("File upload failed:", file.name, error);
            return null;
          }
        })
      );

      const newFileUrls = uploadedFiles.filter(Boolean) as string[];

      // Step 4: Update the work log in the local state for instant UI updates
      setWorkLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                content: editContent,
                timestamp: new Date().toISOString(),
                attachments: [...(log?.attachments || []), ...newFileUrls],
              }
            : log
        )
      );

      // Step 5: Update Firestore with the modified workLogs array
      const updatedWorkLogs = [...existingWorkLogs];
      updatedWorkLogs[workLogIndex] = {
        ...updatedWorkLogs[workLogIndex],
        content: editContent,
        timestamp: new Date().toISOString(),
        attachments: [
          ...updatedWorkLogs[workLogIndex].attachments,
          ...newFileUrls,
        ],
      };

      await updateDoc(negotiationRef, { workLogs: updatedWorkLogs });

      // Step 6: Reset editing state
      cancelEditing();
      toast({ title: "Work log updated successfully" });
    } catch (error) {
      console.error("Error updating work log:", error);
      toast({ title: "Failed to update work log", variant: "destructive" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setLocalFiles((prev) => [...prev, ...Array.from(files)]);
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addWorkLog = async (id: string | null) => {
    if (!newWorkLog.trim() && localFiles.length === 0) return;

    try {
      console.log("Starting file uploads:", localFiles);

      // Upload files and filter out any failed uploads
      let fileUrls: string[] = [];

      const fileArray = Array.from(localFiles);
      const uploadPromises = fileArray.map((file) => uploadFile(file));
      fileUrls = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as string[];

      const validFileUrls = fileUrls.filter((url) => url); // Remove null values
      console.log("Uploaded file URLs:", validFileUrls);

      const logEntry = {
        id: generateRandomId(),
        deal_coordinator_id: user.deal_coordinator_id,
        user: user.name,
        userAvatar: user.profile_pic,
        content: newWorkLog,
        attachments: validFileUrls,
        negotiation_id: negotiationId!,
        timestamp: new Date().toISOString(),
      };

      console.log("Adding WorkLog to Firestore:", logEntry);

      const negotiationRef = doc(db, "delivrd_negotiations", id ?? "");

      await updateDoc(negotiationRef, {
        workLogs: arrayUnion(logEntry),
      });
      // Reset fields
      setNewWorkLog("");
      setLocalFiles([]);
      fetchWorkLogs(negotiationId);
      toast({ title: "Work log added successfully" });
    } catch (error) {
      console.error("Error adding work log:", error);
      toast({ title: "Failed to add work log", variant: "destructive" });
    }
  };

  const cancelEditing = () => {
    setEditingLog(null);
    setEditContent("");
    setEditAttachments([]);
    setEditFiles([]);
  };

  const removeEditAttachment = (logId: string, index: number) => {
    setEditFiles((prev) => prev.filter((_, i) => i !== index));

    setWorkLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === logId
          ? {
              ...log,
              attachments: log?.attachments?.filter((_, i) => i !== index),
            }
          : log
      )
    );
  };

  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"], // Ensure link button is present
    ],
  };

  const handleEditFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    logId: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert File objects to URLs for immediate UI update
    const newAttachments = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    // Update workLogs state
    setWorkLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === logId
          ? {
              ...log,
              attachments: [...(log?.attachments || []), ...newAttachments],
            }
          : log
      )
    );
  };

  useEffect(() => {
    fetchWorkLogs(negotiationId);
  }, [negotiationId]);

  const makeLinksClickable = (content: string) => {
    return (
      content
        // Ensure existing <a> tags are formatted correctly and don't break
        .replace(
          /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g,
          `<a href="$1" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline; word-break: break-word;">$2</a>`
        )
        // Convert plain URLs into clickable links
        .replace(
          /(?<!href=")(https?:\/\/[^\s"<]+)/g,
          `<a href="$1" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline; word-break: break-word;">$1</a>`
        )
    );
  };

  return (
    <TailwindPlusCard title="Work Log" icon={FileText}>
      <div className="space-y-4 mb-4">
        {workLogs
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={log?.userAvatar ?? ""}
                  alt={log?.user !== null ? log?.user?.[0] : ""}
                />
                <AvatarFallback>
                  {log?.user !== null ? log?.user?.[0] : ""}
                </AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-gray-100 flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">{log.user}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      hour12: false,
                      minute: "2-digit",
                      hour: "2-digit",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {editingLog === log.id ? (
                  <div
                    style={{
                      width: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <ReactQuill
                      modules={modules}
                      value={editContent}
                      onChange={setEditContent}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => saveEdit(negotiationId, log.id)}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button variant="destructive" onClick={cancelEditing}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>

                    <input
                      className="my-2"
                      type="file"
                      onChange={(e) => handleEditFileUpload(e, log.id)}
                      multiple
                    />
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <div
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: log?.content
                          ? makeLinksClickable(log.content)
                          : "",
                      }}
                    ></div>
                    {!noActions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(log)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex space-x-4 mt-2">
                  {log?.attachments?.map((file, i) => {
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
                          {editingLog === log.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEditAttachment(log.id, i);
                              }}
                              className="absolute top-[-5px] right-[-5px] z-20 bg-red-600 text-white rounded-full p-1"
                            >
                              <X size={12} />
                            </button>
                          )}
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
      {!noActions && (
        <ReactQuill
          value={newWorkLog}
          onChange={setNewWorkLog}
          className="mb-4"
        />
      )}
      <div className="flex space-x-4 mt-2">
        {localFiles.map((file, index) => {
          const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].some(
            (ext) => file.name.toLowerCase().includes(ext)
          );
          const fileURL = URL.createObjectURL(file);
          return (
            <div key={index} className="relative w-16 h-16">
              <div
                onClick={() => window.open(fileURL, "_blank")}
                className="cursor-pointer w-full h-full flex items-center justify-center rounded-md overflow-hidden border"
              >
                {isImage ? (
                  <img
                    src={fileURL}
                    alt="Attachment"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span>{file.name}</span>
                )}
              </div>
              {!noActions && (
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!noActions && (
        <div className="flex space-x-2 items-center mt-4">
          <label className="cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </label>
          <Button onClick={() => addWorkLog(negotiationId)}>Add Log</Button>
        </div>
      )}
    </TailwindPlusCard>
  );
};

export default WorkLogSection;
