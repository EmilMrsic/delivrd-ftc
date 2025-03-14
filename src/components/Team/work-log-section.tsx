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
} from "firebase/firestore";
import { db } from "@/firebase/config";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import "react-quill/dist/quill.snow.css";
import { toast } from "@/hooks/use-toast";
import { generateRandomId, uploadFile } from "@/lib/utils";

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
  const [newWorkLog, setNewWorkLog] = useState<string>("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [editFiles, setEditFiles] = useState<File[]>([]);

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

  const startEditing = (log: WorkLog) => {
    setEditingLog(log.id);
    setEditContent(log.content);
    setEditAttachments([...log.attachments]);
    setEditFiles([]);
  };

  const saveEdit = async (logId: string) => {
    try {
      // Query Firestore to find the document where "id" matches logId
      const q = query(collection(db, "work_log"), where("id", "==", logId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error("No document found with ID:", logId);
        toast({ title: "Error: Work log not found", variant: "destructive" });
        return;
      }

      // Get the first matching document reference
      const logRef = querySnapshot.docs[0].ref;

      // Upload new files and get URLs
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

      // Remove null values
      const newFileUrls = uploadedFiles.filter(Boolean) as string[];

      // Update workLogs state instantly for UI smoothness
      setWorkLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                content: editContent,
                attachments: [...log.attachments, ...newFileUrls],
              }
            : log
        )
      );

      // Update Firestore after UI state is updated
      await updateDoc(logRef, {
        content: editContent,
        attachments: [
          ...(workLogs.find((log) => log.id === logId)?.attachments || []),
          ...newFileUrls,
        ],
      });

      // Reset editing state
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

  const addWorkLog = async () => {
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
        content: newWorkLog,
        attachments: validFileUrls,
        negotiation_id: negotiationId!,
        timestamp: new Date().toISOString(),
      };

      console.log("Adding WorkLog to Firestore:", logEntry);

      await addDoc(collection(db, "work_log"), logEntry);

      // Reset fields
      setNewWorkLog("");
      setLocalFiles([]);
      fetchWorkLogs();
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
              attachments: log.attachments.filter((_, i) => i !== index),
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
          ? { ...log, attachments: [...log.attachments, ...newAttachments] }
          : log
      )
    );
  };

  useEffect(() => {
    fetchWorkLogs();
  }, [negotiationId]);

  const makeLinksClickable = (content: string) => {
    return (
      content
        // Style existing <a> tags (links added via React Quill)
        .replace(
          /<a([^>]+href="https?:\/\/[^"]+)"([^>]*)>/g,
          `<a$1$2 style="color: blue; text-decoration: underline; word-break: break-word;">`
        )
        // Convert plain URLs into clickable links
        .replace(
          /(?<!href=")(https?:\/\/[^\s"<]+)/g,
          (match) =>
            `<a href="${match}" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline; word-break: break-word;">${match}</a>`
        )
    );
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
        <CardTitle className="flex items-center">
          <FileText className="mr-2" /> Work Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 mb-4">
          {workLogs
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .map((log) => (
              <div key={log.id} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.profile_pic}
                    alt={user?.name !== null ? user?.name[0] : ""}
                  />
                  <AvatarFallback>
                    {user?.name !== null ? user?.name[0] : ""}
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-gray-100 flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{log.user}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
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
                        <Button onClick={() => saveEdit(log.id)}>
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
                          __html: makeLinksClickable(log.content),
                        }}
                      ></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(log)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    </div>
                  )}
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
        <ReactQuill
          value={newWorkLog}
          onChange={setNewWorkLog}
          className="mb-4"
        />
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
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
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
          <Button onClick={addWorkLog}>Add Log</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkLogSection;
