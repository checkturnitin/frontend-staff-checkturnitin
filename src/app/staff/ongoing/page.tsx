"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { serverURL } from "@/utils/utils";

interface PendingCheck {
  id: string;
  priority: string;
  status: string;
  startTime: string;
  duration: string;
  ownerEmail: string;
  staff: string;
  details: string;
}

interface PendingChecksResponse {
  total: number;
  checks: PendingCheck[];
}

export default function OngoingPage() {
  const [checks, setChecks] = useState<PendingCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingChecks = async () => {
    try {
      const response = await fetch(`${serverURL}/staff/pending-checks`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending checks");
      }

      const data: PendingChecksResponse = await response.json();
      setChecks(data.checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChecks();
    const interval = setInterval(fetchPendingChecks, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Ongoing Checks</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pending Checks ({checks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(check.priority)}>
                        {check.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{check.ownerEmail}</TableCell>
                    <TableCell>{check.staff}</TableCell>
                    <TableCell>{check.duration}</TableCell>
                    <TableCell className="max-w-xs truncate">{check.details}</TableCell>
                  </TableRow>
                ))}
                {checks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No pending checks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
