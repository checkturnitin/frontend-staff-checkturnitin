"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { serverURL } from "@/utils/utils";
import { FiHome } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DashboardCard = ({ title, value }: { title: string; value: number }) => (
  <Card
    className={`hover:shadow-lg transition-all duration-300 bg-gray-800 border ${
      title === "Pending Checks" ? "border-yellow-500" : "border-gray-700"
    }`}
  >
    <CardHeader className="flex items-center gap-4">
      <CardTitle className="text-lg text-white">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold text-white">
        {value > 0 ? value.toLocaleString() : "N/A"}
      </p>
    </CardContent>
  </Card>
);

export default function Page() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [todaysChecks, setTodaysChecks] = useState<number>(0);
  const [overdueReports, setOverdueReports] = useState<any[]>([]);
  const [totalChecksCount, setTotalChecksCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Fetch dashboard data
  const getDashboardData = async () => {
    try {
      const response = await axios.get(`${serverURL}/staff/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("Dashboard data:", response.data);

      setPendingCount(response.data.pendingCount);
      setCompletedCount(response.data.completedCount);
      setTodaysChecks(response.data.todaysChecks);
      setOverdueReports(response.data.pendingReports);
      setTotalChecksCount(response.data.totalChecksCount);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Fetch staff data (including isOnline status)
  const getStaffData = async () => {
    try {
      const response = await axios.get(`${serverURL}/staff`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("Staff data:", response.data);
      setIsOnline(response.data.staff.isOnline);
    } catch (error) {
      console.error("Error fetching staff data:", error);
    }
  };

  // Toggle online status
  const toggleOnlineStatus = async () => {
    try {
      const response = await axios.post(
        `${serverURL}/staff/toggle-online`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setIsOnline(response.data.isOnline);
    } catch (error) {
      console.error("Error toggling online status:", error);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await getDashboardData();
      await getStaffData();
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    getDashboardData();
    getStaffData();
    setLoading(false);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const calculateProgress = (hoursLeft: number) => {
    return Math.min(100, Math.max(0, ((24 - hoursLeft) / 24) * 100));
  };

  const handleToggleOnlineStatus = () => {
    setShowConfirmation(true);
  };

  const handleConfirmToggle = () => {
    toggleOnlineStatus();
    setShowConfirmation(false);
  };

  const handleCancelToggle = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="w-full min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FiHome className="mr-2" /> Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="text-white border-gray-600"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              variant={isOnline ? "default" : "destructive"}
              onClick={handleToggleOnlineStatus}
              className={`${
                isOnline
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              } text-white shadow-lg ${
                isOnline ? "shadow-green-500/50" : "shadow-red-500/50"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </Button>
          </div>
        </div>
        <p className="text-lg text-gray-400 mb-8">{today}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <Skeleton className="h-28 bg-gray-700 rounded-lg" />
              <Skeleton className="h-28 bg-gray-700 rounded-lg" />
              <Skeleton className="h-28 bg-gray-700 rounded-lg" />
            </>
          ) : (
            <>
              <DashboardCard title="Pending Checks" value={pendingCount} />
              <DashboardCard title="Completed Checks" value={completedCount} />
              <DashboardCard title="Today's Checks" value={todaysChecks} />
              <DashboardCard title="Total Checks" value={totalChecksCount} />
            </>
          )}
        </div>

        {loading
          ? null
          : overdueReports.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl text-white font-semibold mb-4">
                  Overdue Reports
                </h2>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  {overdueReports.map((report: any) => (
                    <div
                      key={report._id}
                      className="mb-4 p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white text-xl font-bold">
                          Check ID: {report._id}
                        </p>
                        <p
                          className={`text-${
                            report.hoursLeft < 0 ? "red" : "yellow"
                          }-400 text-lg font-semibold`}
                        >
                          {report.hoursLeft < 0
                            ? `${Math.abs(report.hoursLeft)} Hours Delayed`
                            : `${report.hoursLeft} Hours Left`}
                        </p>
                      </div>
                      <p className="text-gray-400">
                        Report ID: {report.reportId?._id || "N/A"}
                      </p>
                      <p className="text-gray-400">
                        Delivery Time:{" "}
                        {new Date(report.deliveryTime).toLocaleString()}
                      </p>
                      <div className="mt-2">
                        <Progress
                          value={calculateProgress(report.hoursLeft)}
                          className={`h-2 ${
                            report.hoursLeft < 0
                              ? "bg-red-500 [&>div]:bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "yellow" }}>
                Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: "yellow" }}>
                This will change your online status to{" "}
                {isOnline ? "Offline" : "Online"}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleCancelToggle}
                style={{ color: "yellow" }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmToggle}
                style={{ color: "red" }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}