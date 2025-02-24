"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { serverURL } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DashboardCardProps {
  title: string;
  value: number;
  status: string; 
}

const getCardBorderClass = (status: string) => {
  switch (status) {
    case "completed":
      return "border-green-500";
    case "pending":
      return "border-yellow-500";
    case "processing":
      return "border-blue-500";
    case "failed":
      return "border-red-500";
    default:
      return "border-white";
  }
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, status }) => (
  <Card
    className={`hover:shadow-xl transition-all duration-300 bg-black ${getCardBorderClass(
      status
    )} border-2 rounded-lg shadow-md`}
  >
    <CardHeader className="flex items-center gap-4">
      <CardTitle className="text-lg text-white font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-extrabold text-white">
        {value > 0 ? value.toLocaleString() : "0"}
      </p>
    </CardContent>
  </Card>
);

export default function MyStatsPage() {
  interface Stats {
    totalChecks: number;
    pendingChecks: number;
    processingChecks: number;
    completedChecks: number;
    failedChecks: number;
    dailyChecks: number;
    weeksCompletedChecks: number[];
  }

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const getStats = async () => {
    try {
      const response = await axios.get(`${serverURL}/staff/checks/stats?year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, [year]);

  const getCurrentWeekIndex = (): number => {
    const currentDate = new Date();
    const startOfYear = new Date(year, 0, 1);
    const daysSinceStart = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSinceStart / 7);
  };

  const handlePrint = () => {
    window.print();
  };

  const chartData = {
    labels: Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: "Completed Checks per Week",
        data: stats?.weeksCompletedChecks ?? [],
        fill: false,
        backgroundColor: "rgba(75,192,192,1)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  const currentWeekIndex = getCurrentWeekIndex();

  return (
    <div className="w-full min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-white">My Stats</h1>
          <select
            className="bg-black text-white border border-white p-2 rounded"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {[2025, 2026, 2027, 2028, 2029].map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
            <Skeleton className="h-28 bg-gray-700 rounded-lg" />
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard title="Total Checks" value={stats?.totalChecks ?? 0} status="default" />
              <DashboardCard title="Pending Checks" value={stats?.pendingChecks ?? 0} status="pending" />
              <DashboardCard title="Processing Checks" value={stats?.processingChecks ?? 0} status="processing" />
              <DashboardCard title="Completed Checks" value={stats?.completedChecks ?? 0} status="completed" />
              <DashboardCard title="Failed Checks" value={stats?.failedChecks ?? 0} status="failed" />
              <DashboardCard title="Today's Checks" value={stats?.dailyChecks ?? 0} status="default" />
            </div>
            <div className="my-8 bg-white p-4 rounded shadow-lg">
              <Line
                data={chartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
            <div className="bg-white p-4 rounded shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">Weekly Completed Checks</h2>
                <Button
                  variant="outline"
                  className="text-black border-black hover:bg-gray-200 transition-colors"
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.weeksCompletedChecks.map((count, index) => (
                    <tr key={index} className={index === currentWeekIndex ? "bg-yellow-200" : ""}>
                      <td className="px-6 py-4 text-black whitespace-nowrap">Week {index + 1}</td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}