"use client";

import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { serverURL } from "@/utils/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Download,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";

interface Check {
  _id: string;
  fileId: string;
  reportId?: string;
  status: string;
  deliveryTime: string;
  fileName: string;
  storedFileName: string;
  fileSize: number;
  priority: string;
}

interface FileDetails {
  _id: string;
  userId: string;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  fileType: string;
  fileReference: string;
  uploadedAt: string;
  eTag: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ClassificationResult {
  type: string;
  Overall_Similarity: number | null;
  AI_Detection: number;
  AI_Detection_Asterisk: boolean;
  Below_Threshold: boolean;
}

export default function ChecksPage() {
  const [pendingChecks, setPendingChecks] = useState<Check[]>([]);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expectedFiles, setExpectedFiles] = useState<FileDetails[]>([]);
  const [isLoadingExpectedFiles, setIsLoadingExpectedFiles] = useState(false);
  const [classificationResults, setClassificationResults] = useState<
    ClassificationResult[]
  >([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [checkIdCopied, setCheckIdCopied] = useState<string | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    const fetchPendingChecks = async () => {
      try {
        const response = await fetch(
          `${serverURL}/staff/checks?status=pending`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();

        if (data.checks.length > 0) {
          const checksWithStoredFileName = await Promise.all(
            data.checks.map(async (check: Check) => {
              const fileResponse = await fetch(
                `${serverURL}/staff/file/${check.fileId}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                return {
                  ...check,
                  storedFileName: fileData.file
                    ? fileData.file.storedFileName
                    : "Unknown",
                  fileSize: fileData.file ? fileData.file.fileSize : 1,
                  priority: check.priority || "Normal", // Default to "Normal" if priority is not provided
                };
              } else {
                return {
                  ...check,
                  storedFileName: "Unknown",
                  priority: check.priority || "Normal",
                };
              }
            })
          );

          setPendingChecks(checksWithStoredFileName);
          fetchExpectedFiles(checksWithStoredFileName[0].fileId);
        }
      } catch (error) {
        console.error("Failed to fetch pending checks:", error);
        toast.error("Failed to fetch pending checks.");
      }
    };

    if (localStorage.getItem("token")) {
      fetchPendingChecks();
    }
  }, []);

  const fetchExpectedFiles = async (fileId: string) => {
    setIsLoadingExpectedFiles(true);
    try {
      const response = await fetch(`${serverURL}/staff/file/${fileId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpectedFiles(data.file ? [data.file] : []);
      } else {
        toast.error("Failed to fetch expected files.");
      }
    } catch (error) {
      console.error("Error fetching expected files:", error);
      toast.error("An error occurred while fetching expected files.");
    } finally {
      setIsLoadingExpectedFiles(false);
    }
  };

  const classifyPDF = async (file: File): Promise<ClassificationResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${serverURL}/file/pdfclassify`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to classify PDF");
    }

    const result: ClassificationResult = await response.json();
    return result;
  };

  const handleSubmit = async () => {
    if (
      files.length === 0 ||
      files.length > 2 ||
      files.some(
        (file) =>
          !isFileNameValid(
            file,
            getExpectedFileNames(expectedFiles[0].storedFileName)
          )
      )
    ) {
      toast.error("Please upload exactly 1 or 2 files with valid names.");
      return;
    }

    setIsPreviewOpen(true);
    setIsClassifying(true);

    try {
      const classificationPromises = files.map((file) => classifyPDF(file));
      const results = await Promise.all(classificationPromises);
      console.log(results);
      
      setClassificationResults(results);
    } catch (error) {
      console.error("Error classifying files:", error);
      toast.error("An error occurred while classifying files.");
    } finally {
      setIsClassifying(false);
    }
  };

  const isValidClassification = (result: ClassificationResult) => {
    return (
      (result.type === "AI Detection Report" && result.AI_Detection >= -1) ||
      (result.type === "Plagiarism Report" &&
        result.Overall_Similarity !== null)
    );
  };

  const allFilesValidated =
    classificationResults.length === files.length &&
    classificationResults.every(isValidClassification);

  const confirmUpload = async () => {
    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("checkId", pendingChecks[currentCheckIndex]._id);

    // Add classification results to the form data
    classificationResults.forEach((result, index) => {
      formData.append(`classificationResults[${index}][type]`, result.type);
      formData.append(
        `classificationResults[${index}][Overall_Similarity]`,
        result.Overall_Similarity !== null
          ? result.Overall_Similarity.toString()
          : ""
      );
      formData.append(
        `classificationResults[${index}][AI_Detection]`,
        result.AI_Detection !== null ? result.AI_Detection.toString() : "-1"
      );
      formData.append(
        `classificationResults[${index}][AI_Detection_Asterisk]`,
        result.AI_Detection_Asterisk !== null
          ? result.AI_Detection_Asterisk.toString()
          : ""
      );
      formData.append(
        `classificationResults[${index}][Below_Threshold]`,
        result.Below_Threshold !== null ? result.Below_Threshold.toString() : ""
      );
    });

    try {
      const response = await fetch(`${serverURL}/staff/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Files uploaded successfully with score -1!");
        const updatedChecks = pendingChecks.filter(
          (_, index) => index !== currentCheckIndex
        );
        setPendingChecks(updatedChecks);
        setFiles([]);
        if (updatedChecks.length > 0) {
          setCurrentCheckIndex(0);
          fetchExpectedFiles(updatedChecks[0].fileId);
        }
        setUploaded(true);
      } else {
        toast.error("Failed to upload files.");
        setUploaded(false);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("An error occurred while uploading files.");
    } finally {
      setIsUploading(false);
      setIsPreviewOpen(false);
    }
  };

  const handleDownload = async (fileId: string, checkId: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${serverURL}/file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ fileId, checkId }),
        //send checkid too
      });

      if (response.ok) {
        console.log(response.headers)
        const blob = await response.blob();
        const fileName =
          response.headers.get("X-File-Name") || "downloaded_file";

        const fileExtension = response.headers.get("X-File-Extension") || "pdf";

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${fileName}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("File downloaded successfully!");
      } else {
        toast.error("Failed to download file.");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("An error occurred while downloading the file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedChecks.length === 0) {
      toast.error("Please select at least one file to download.");
      return;
    }

    setIsDownloading(true);
    try {
      for (const checkId of selectedChecks) {
        const check = pendingChecks.find((c) => c._id === checkId);
        if (check) {
          await handleDownload(check.fileId, check._id);
        }
      }
    } catch (error) {
      console.error("Error downloading files:", error);
      toast.error("An error occurred while downloading files.");
    } finally {
      setIsDownloading(false);
    }
  };

  const scrollToUploadSection = () => {
    if (uploadSectionRef.current) {
      uploadSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCheckSelection = (index: number) => {
    setCurrentCheckIndex(index);
    fetchExpectedFiles(pendingChecks[index].fileId);
  };

  const handleCheckboxChange = (checkId: string) => {
    setSelectedChecks((prev) =>
      prev.includes(checkId)
        ? prev.filter((id) => id !== checkId)
        : [...prev, checkId]
    );
  };

  const handleCheckIdClick = (checkId: string) => {
    navigator.clipboard.writeText(checkId);
    setCheckIdCopied(checkId);
    setTimeout(() => setCheckIdCopied(null), 2000);
  };

  const calculateTimeRemaining = (deliveryTime: string) => {
    const now = new Date();
    const delivery = new Date(deliveryTime);
    const timeRemaining = delivery.getTime() - now.getTime();
    return timeRemaining;
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining <= 0) {
      return "Overdue";
    }
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );
    return `${hours}h ${minutes}m`;
  };

  const calculateProgress = (deliveryTime: string) => {
    const now = new Date();
    const delivery = new Date(deliveryTime);
    const total = 24 * 60 * 60 * 1000; // 24 hours total time
    const elapsed = now.getTime() - (delivery.getTime() - total);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getProgressColor = (deliveryTime: string) => {
    const timeRemaining = calculateTimeRemaining(deliveryTime);
    if (timeRemaining <= 0) {
      return "bg-red-500";
    } else if (timeRemaining < 2 * 60 * 60 * 1000) {
      return "bg-yellow-500";
    }
    return "bg-blue-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-600 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getExpectedFileNames = (originalFileName: string) => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
    return [
      `${baseName}.pdf`,
      `${baseName} (1).pdf`,
      `${baseName} (2).pdf`,
      `${baseName}-ai.pdf`,
      `${baseName}-plag.pdf`,
    ];
  };

  const isFileNameValid = (file: File, expectedNames: string[]) => {
    return expectedNames.includes(file.name);
  };

  const formatFileSize = (size: number) => {
    const mb = size / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  return (
    <div
      className={cn(
        "p-6 bg-black text-white min-h-screen",
        isUploading ? "opacity-50" : "opacity-100",
        uploaded ? "border-4 border-green-500" : ""
      )}
    >
      <h1 className="text-3xl font-bold mb-6 text-center">
        Pending Checks Overview
      </h1>
      {pendingChecks.length === 0 ? (
        <p className="text-gray-400 text-center">
          No pending checks available.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Current Check Section */}
          <AnimatePresence>
            <motion.div
              key={pendingChecks[currentCheckIndex]._id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 p-6 rounded-lg"
            >
              <h2 className="text-lg font-bold mb-4">Current Check Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-gray-300">
                  <strong>ID:</strong> {pendingChecks[currentCheckIndex]._id}
                </div>
                <div className="text-gray-300 flex items-center">
                  <strong>File ID:</strong>&nbsp;
                  {pendingChecks[currentCheckIndex].fileId}
                  <Button
                    className="ml-4 bg-blue-500 flex items-center justify-center gap-3 font-semibold shadow-lg text-white px-5 py-2 rounded-md hover:bg-blue-600 transition duration-150 ease-in-out"
                    onClick={() =>
                      handleDownload(
                        pendingChecks[currentCheckIndex].fileId,
                        pendingChecks[currentCheckIndex]._id
                      )
                    }
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        Download
                        <Download className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-gray-300">
                  <strong>Stored File:</strong>{" "}
                  {pendingChecks[currentCheckIndex].storedFileName}
                </div>
                <div className="text-gray-300">
                  <strong>File Size:</strong>{" "}
                  {formatFileSize(pendingChecks[currentCheckIndex].fileSize)}
                </div>
                <div className="text-gray-300">
                  <strong>Priority:</strong>{" "}
                  <span
                    className={`px- py-1 rounded-full ${getPriorityColor(
                      pendingChecks[currentCheckIndex].priority
                    )}`}
                  >
                    {pendingChecks[currentCheckIndex].priority}
                  </span>
                </div>
                <div className="text-gray-300">
                  <strong>Delivery Time:</strong>{" "}
                  {new Date(
                    pendingChecks[currentCheckIndex].deliveryTime
                  ).toLocaleString()}
                </div>
                <div className="text-gray-300">
                  <strong>Time Remaining:</strong>{" "}
                  {formatTimeRemaining(
                    calculateTimeRemaining(
                      pendingChecks[currentCheckIndex].deliveryTime
                    )
                  )}
                </div>
                <Progress
                  value={calculateProgress(
                    pendingChecks[currentCheckIndex].deliveryTime
                  )}
                  className={cn(
                    "col-span-full mt-4",
                    getProgressColor(
                      pendingChecks[currentCheckIndex].deliveryTime
                    )
                  )}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Expected Upload Files Section */}
          <div ref={uploadSectionRef} className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Expected Upload Files</h2>
            {isLoadingExpectedFiles ? (
              <p className="text-gray-400">Loading expected files...</p>
            ) : expectedFiles.length > 0 ? (
              <div>
                <ul>
                  {expectedFiles.map((file) => (
                    <li
                      key={file._id}
                      className="flex items-center mb-2 text-gray-300"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="text-green-500 font-semibold">
                        {file.storedFileName}
                      </span>{" "}
                      (Original:{" "}
                      <span className="text-gray-500">
                        {file.originalFileName}
                      </span>
                      )
                    </li>
                  ))}
                </ul>
                <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-md font-semibold mb-2">
                    Expected File Names (upload only 2 files):
                  </h3>
                  <ul className="flex flex-wrap gap-2 font-bold text-gray-200">
                    {getExpectedFileNames(expectedFiles[0].storedFileName).map(
                      (name, index) => (
                        <li key={index}>{name}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No expected files found.</p>
            )}
          </div>

          {/* File Upload Section */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <FileUpload
              onChange={(files) => setFiles(files)}
              accept=".pdf,.doc,.docx"
              files={files}
            />
            <p className="text-gray-300 mt-4">
              Number of uploads left: {2 - files.length}
            </p>
            <p className="text-4xl font-extrabold text-center mt-4 text-white-400">
              Expected File Names
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-3 text-2xl text-gray-500">
              {expectedFiles.length > 0 &&
                getExpectedFileNames(expectedFiles[0].storedFileName).map(
                  (name, index) => (
                    <p
                      key={index}
                      className={cn(
                        "font-bold text-white-400",
                        files.some((file) => file.name === name)
                          ? "bg-green-600 text-white p-2 rounded-md"
                          : ""
                      )}
                    >
                      {name}
                    </p>
                  )
                )}
            </div>
            <div className="flex gap-2 mt-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={cn(
                    "px-2 py-1 rounded-md",
                    isFileNameValid(
                      file,
                      getExpectedFileNames(expectedFiles[0].storedFileName)
                    )
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  )}
                >
                  {file.name}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center mt-8">
            <Button
              onClick={handleSubmit}
              disabled={
                isUploading ||
                files.length === 0 ||
                files.length > 2 ||
                files.some(
                  (file) =>
                    !isFileNameValid(
                      file,
                      getExpectedFileNames(expectedFiles[0].storedFileName)
                    )
                )
              }
              className="w-full bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-semibold disabled:bg-gray-600 hover:bg-green-700 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Submit Files"
              )}
            </Button>
          </div>

          {/* Confirmation Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="sm:max-w-[80%] text-white bg-gray-800 rounded-lg border-red-50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Confirm Submission
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-6">
                {files.map((file, index) => (
                  <div key={index} className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
                    <div className="h-[400px] overflow-y-auto border border-gray-700 rounded-lg">
                      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer
                          fileUrl={URL.createObjectURL(file)}
                          initialPage={0}
                          defaultScale={SpecialZoomLevel.PageFit}
                          renderLoader={(percentages: number) => (
                            <div className="text-center text-gray-300">
                              Loading... {Math.round(percentages)}%
                            </div>
                          )}
                        />
                      </Worker>
                    </div>
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                      <h4 className="text-lg font-semibold mb-2">
                        Classification Results:
                      </h4>
                      {isClassifying ? (
                        <div className="flex items-center text-gray-300">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Classifying...
                        </div>
                      ) : classificationResults[index] ? (
                        <>
                          <p>Type: {classificationResults[index].type}</p>
                          {classificationResults[index].type ===
                          "AI Detection Report" ? (
                            <p>
                              AI Detection:{" "}
                              {classificationResults[index].AI_Detection === -1
                                ? "0-20%"
                                : `${classificationResults[index].AI_Detection}%`}
                            </p>
                          ) : (
                            <p>
                              Overall Similarity:{" "}
                              {classificationResults[index].Overall_Similarity}%
                            </p>
                          )}
                          {isValidClassification(
                            classificationResults[index]
                          ) ? (
                            <CheckCircle
                              className="text-green-500 mt-2"
                              size={24}
                            />
                          ) : (
                            <AlertCircle
                              className="text-red-500 mt-2"
                              size={24}
                            />
                          )}
                        </>
                      ) : (
                        <p>No classification result available</p>
                      )}
                    </div>
                    {!isFileNameValid(
                      file,
                      getExpectedFileNames(expectedFiles[0].storedFileName)
                    ) && (
                      <div className="mt-2 p-2 bg-red-600 rounded-lg">
                        <p className="text-white">
                          Warning: File name does not match expected format
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setIsPreviewOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmUpload}
                  disabled={
                    isClassifying ||
                    isUploading ||
                    !allFilesValidated ||
                    files.some(
                      (file) =>
                        !isFileNameValid(
                          file,
                          getExpectedFileNames(expectedFiles[0].storedFileName)
                        )
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg ml-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Confirm and Submit"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Pending Queue Section */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Pending Queue</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-3 px-3 border-b border-gray-600 text-left text-gray-100">
                      Select
                    </th>
                    <th className="py-3 px-3 border-b border-gray-600 text-left text-gray-100">
                      Priority
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Check ID
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      File ID
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Stored File Name
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      File Size
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Delivery Time
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Time Remaining
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Progress
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100">
                      Actions
                    </th>
                    <th className="py-3 px-6 border-b border-gray-600 text-left text-gray-100 text-right">
                      Bulk Download
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingChecks.map((check, index) => (
                    <motion.tr
                      key={check._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`cursor-pointer ${
                        index === currentCheckIndex ? "bg-blue-900" : ""
                      }`}
                      onClick={() => handleCheckSelection(index)}
                    >
                      <td className="py-3 px-3 border-b border-gray-700 text-gray-300 text-center">
                        <input
                          type="checkbox"
                          checked={selectedChecks.includes(check._id)}
                          onChange={() => handleCheckboxChange(check._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                        />
                      </td>
                      <td className="py-3 px-3 border-b border-gray-700 text-gray-300 text-center">
                        <span
                          className={`px-5 py-1 rounded-full ${getPriorityColor(
                            check.priority
                          )}`}
                        >
                          {check.priority}
                        </span>
                      </td>
                      <td
                        className="py-3 px-6 border-b border-gray-700 text-gray-300 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckIdClick(check._id);
                        }}
                      >
                        {check._id.slice(-4)}
                        {checkIdCopied === check._id ? (
                          <ClipboardCheck
                            className="inline ml-1 text-green-400"
                            size={16}
                          />
                        ) : (
                          <Clipboard
                            className="inline ml-1 text-gray-400"
                            size={16}
                          />
                        )}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        {check.fileId?.slice(-5)}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        {check.storedFileName}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        {formatFileSize(check.fileSize)}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        {new Date(check.deliveryTime).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        {formatTimeRemaining(
                          calculateTimeRemaining(check.deliveryTime)
                        )}
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300">
                        <Progress
                          value={
                            calculateTimeRemaining(check.deliveryTime) <= 0
                              ? 100
                              : calculateProgress(check.deliveryTime)
                          }
                          className={cn(getProgressColor(check.deliveryTime))}
                        />
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300 flex justify-around">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(check.fileId, check._id);
                          }}
                          disabled={isDownloading}
                          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-600 hover:bg-blue-600 transition hover:scale-105 transform duration-150"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              Download
                              <Download className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckSelection(index);
                            scrollToUploadSection();
                          }}
                          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition hover:scale-105 transform duration-150 ml-1"
                        >
                          Upload
                        </Button>
                      </td>
                      <td className="py-3 px-6 border-b border-gray-700 text-gray-300 text-right">
                        <Button
                          onClick={handleBulkDownload}
                          disabled={
                            isDownloading || selectedChecks.length === 0
                          }
                          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-600 hover:bg-blue-600 transition hover:scale-105 transform duration-150"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            "Download Selected"
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
