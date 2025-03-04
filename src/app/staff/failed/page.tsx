"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { serverURL } from "@/utils/utils";

interface FailedCheck {
  _id: string;
  fileType: string;
  failureReason: string;
  completedAt: string;
}

export default function FailedChecksPage() {
  const [failedChecks, setFailedChecks] = useState<FailedCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const fetchFailedChecks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${serverURL}/staff/checks/staff-failed?page=${page}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setFailedChecks(response.data.checks);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (error) {
      toast.error("Failed to load failed checks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedChecks();
  }, [page]);

  const handleFailCheck = async () => {
    if (!selectedCheckId || !reason.trim()) {
      toast.error("Check ID and reason are required.");
      return;
    }

    try {
      await axios.post(
        `${serverURL}/staff/checks/fail`,
        { checkId: selectedCheckId, reason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Check marked as failed!");
      setModalOpen(false);
      setReason("");
      setSelectedCheckId(null);
      fetchFailedChecks();
    } catch (error) {
      toast.error("Failed to mark check as failed.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Failed Checks</h1>
          <Button
            variant="destructive"
            className="border-2 border-red-500 rounded-lg px-4 py-2"
            onClick={() => setModalOpen(true)}
          >
            Fail a Check ❌
          </Button>
        </div>

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {failedChecks.map((check) => (
              <Card
                key={check._id}
                className="border-red-500 border-2 rounded-lg bg-black shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-white">Check Failed ❌</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white">
                    <strong>ID:</strong> {check._id}
                  </p>
                  <p className="text-white">
                    <strong>File Type:</strong> {check.fileType}
                  </p>
                  <p className="text-red-400">
                    <strong>Reason:</strong> {check.failureReason}
                  </p>
                  <p className="text-gray-400 text-sm">
                    <strong>Completed At:</strong>{" "}
                    {new Date(check.completedAt).toLocaleString()}
                  </p>
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => {
                      setSelectedCheckId(check._id);
                      setModalOpen(true);
                    }}
                  >
                    Mark as Failed Again
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-white">
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>

        {/* Modal for marking a check as failed */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Check as Failed</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Enter Check ID"
              value={selectedCheckId || ""}
              onChange={(e) => setSelectedCheckId(e.target.value)}
              className="text-white"
            />
            <Input
              placeholder="Enter failure reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-white"

            />
            <DialogFooter>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleFailCheck}>
                Confirm Failure
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
