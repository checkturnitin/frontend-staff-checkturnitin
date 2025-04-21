"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serverURL } from "@/utils/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DailyData {
  high: number;
  medium: number;
  low: number;
  dailyTotal: number;
  date: string;
}

interface MonthlyData {
  high: number;
  medium: number;
  low: number;
  monthlyTotal: number;
}

interface StatsData {
  yearlyTotals: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  monthlyData: {
    [key: number]: MonthlyData;
  };
  dailyData: {
    [key: string]: DailyData;
  };
}

interface StatsResponse {
  year: number;
  totalChecks: number;
  stats: StatsData;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${serverURL}/staff/checks/priority-count?year=${selectedYear}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedYear]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  const chartData = Object.entries(stats.stats.monthlyData).map(([month, data]) => ({
    name: new Date(2000, parseInt(month), 1).toLocaleString("default", { month: "short" }),
    high: data.high,
    medium: data.medium,
    low: data.low,
  }));

  const tableData = Object.entries(stats.stats.monthlyData).map(([month, data]) => ({
    month: new Date(2000, parseInt(month), 1).toLocaleString("default", { month: "long" }),
    ...data,
  }));

  const dailyTableData = Object.entries(stats.stats.dailyData)
    .map(([_, data]) => ({
      formattedDate: new Date(data.date).toLocaleDateString(),
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Priority Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalChecks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yearly Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>High Priority: {stats.stats.yearlyTotals.high}</p>
              <p>Medium Priority: {stats.stats.yearlyTotals.medium}</p>
              <p>Low Priority: {stats.stats.yearlyTotals.low}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Year</CardTitle>
          </CardHeader>
          <CardContent className="text-white">
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="text-white">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="high" name="High Priority" fill="#ef4444" />
                <Bar dataKey="medium" name="Medium Priority" fill="#f59e0b" />
                <Bar dataKey="low" name="Low Priority" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monthly">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">High Priority</TableHead>
                      <TableHead className="text-right">Medium Priority</TableHead>
                      <TableHead className="text-right">Low Priority</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell className="text-right">{row.high}</TableCell>
                        <TableCell className="text-right">{row.medium}</TableCell>
                        <TableCell className="text-right">{row.low}</TableCell>
                        <TableCell className="text-right font-bold">{row.monthlyTotal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="daily">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">High Priority</TableHead>
                      <TableHead className="text-right">Medium Priority</TableHead>
                      <TableHead className="text-right">Low Priority</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyTableData.map((row) => (
                      <TableRow key={row.formattedDate}>
                        <TableCell className="font-medium">{row.formattedDate}</TableCell>
                        <TableCell className="text-right">{row.high}</TableCell>
                        <TableCell className="text-right">{row.medium}</TableCell>
                        <TableCell className="text-right">{row.low}</TableCell>
                        <TableCell className="text-right font-bold">{row.dailyTotal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
