"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { serverURL } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Check {
  _id: string;
  checkId: string;
  fileType: string;
  updatedAt: string;
  creditsUsed: number;
}

export default function StaffCompletedChecksPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchCompletedChecks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverURL}/staff/checks/staff-completed`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setChecks(response.data.checks);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching completed checks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedChecks();
  }, [page]);

  // Function to format time difference
  const formatUpdatedTime = (dateString: string) => {
    const updatedTime = new Date(dateString).getTime();
    const currentTime = new Date().getTime();
    const diffHours = Math.floor((currentTime - updatedTime) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return new Date(dateString).toLocaleString(); // Full date-time format
    }
  };

  return (
    <div className="w-full min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-6">Completed Checks</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
          </div>
        ) : checks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {checks.map((check) => (
              <Card key={check._id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-white font-semibold">Check ID: {check._id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">File Type: {check.fileType}</p>
                  <p className="text-sm text-gray-400">Credits Used: {check.creditsUsed}</p>
                  <p className="text-xs text-gray-500">Updated: {formatUpdatedTime(check.updatedAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No completed checks found.</p>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center mt-6 space-x-4">
          <Button
            className="border border-white text-white"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-white">
            Page {page} of {totalPages}
          </span>
          <Button
            className="border border-white text-white"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
