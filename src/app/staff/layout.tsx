"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster, toast } from "sonner"; // Using sonner for notifications
import { appName } from "@/utils/utils";

import { serverURL } from "@/utils/utils";
import {
  FiCreditCard,
  FiHome,
  FiLogOut,
  FiMoreHorizontal,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { GiWhirlpoolShuriken } from "react-icons/gi";
import { IoIosStats } from "react-icons/io";
import { FaFileInvoice } from "react-icons/fa";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const pathName = usePathname();
  const [user, setUser] = useState<any>();
  const [pendingCounts, setPendingCounts] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });

  useEffect(() => {
    const fetchPendingChecks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${serverURL}/staff/checks/pending`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch pending checks");
        }

        const data = await response.json();
        setPendingCounts({
          total: data.totalPending,
          highPriority: data.highPriorityPending,
          mediumPriority: data.mediumPriorityPending,
          lowPriority: data.lowPriorityPending,
        });
        toast.success("All pending checks successfully fetched!");
      } catch (error) {
        toast.error("Error fetching pending checks");
        console.error("Error fetching pending checks:", error);
      }
    };

    fetchPendingChecks();

    const interval = setInterval(fetchPendingChecks, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval); // Clean up on component unmount
  }, []);

  const menuItems = [
    { href: "/staff/dashboard", icon: FiHome, label: "Dashboard" },
    { href: "/staff/checks", icon: GiWhirlpoolShuriken, label: "All Checks" },
    {
      href: "/staff/high",
      icon: FaFileInvoice,
      label: "High Priority Checks",
    },
    {
      href: "/staff/medium",
      icon: FiCreditCard,
      label: "Medium Priority Checks",
    },
    {
      href: "/staff/low",
      icon: FiCreditCard,
      label: "Low Priority Checks",
    },
    {
      href: "/staff/compeleted",
      icon: FiCreditCard,
      label: "Completed Checks",
    },
    {
      href: "/staff/failed",
      icon: FiCreditCard,
      label: "Fail a check",
    },
    {
      href: "/staff/checks/searchchecks",
      icon: IoIosStats,
      label: "Search Checks",
    },
    {
      href: "/staff/mystat",
      icon: IoIosStats,
      label: "My Stats",
    },
  ];

  return (
    <main
      className="flex bg-black text-white h-screen w-screen p-2 max-sm:p-0"
      onClick={() => {
        if (moreMenuOpen) setMoreMenuOpen(false);
      }}
    >
      <div
        className={`flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        } h-full transition-all duration-300 ease-in-out bg-black border-r border-indigo-500`}
      >
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/">
              <p className="font-semibold text-indigo-500">{appName} | Staff</p>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 p-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center" : "justify-start"
                  } p-2 rounded-md ${
                    pathName.includes(item.href)
                      ? "bg-indigo-500"
                      : "hover:bg-indigo-700"
                  } transition-colors`}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="ml-2">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-indigo-500">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-700 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <FiUser />
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="font-semibold truncate">
                  {user?.name || "Staff User"}
                </p>
              </div>
            )}
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <FiMoreHorizontal />
            </button>
          </div>
          {moreMenuOpen && (
            <div className="mt-2 bg-neutral-900 rounded-md p-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="flex items-center gap-2 w-full p-2 hover:bg-indigo-700 rounded-md transition-colors"
              >
                <FiLogOut className="text-red-500" />
                {!isCollapsed && <span>Logout</span>}
              </button>
            </div>
          )}
          <div className={`mt-4 ${isCollapsed ? "text-center" : ""}`}>
            <div className="text-sm font-semibold text-yellow-400">
              <p>{pendingCounts.total} Total Pending Checks</p>
            </div>
            {!isCollapsed && (
              <div className="mt-2 space-y-1 text-sm text-gray-300">
                <p>High Priority: {pendingCounts.highPriority}</p>
                <p>Medium Priority: {pendingCounts.mediumPriority}</p>
                <p>Low Priority: {pendingCounts.lowPriority}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 h-full overflow-y-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Pending Status</h1>
          <div className="bg-neutral-900 p-4 rounded-md">
            <div className="flex justify-start text-sm text-gray-300 space-x-8">
              <div className="flex flex-col items-start">
          <p className="font-semibold text-yellow-400">Total</p>
          <p>{pendingCounts.total}</p>
              </div>
              <div className="flex flex-col items-start">
          <p className="font-semibold text-red-400">High Priority</p>
          <p>{pendingCounts.highPriority}</p>
              </div>
              <div className="flex flex-col items-start">
          <p className="font-semibold text-orange-400">Medium Priority</p>
          <p>{pendingCounts.mediumPriority}</p>
              </div>
              <div className="flex flex-col items-start">
          <p className="font-semibold text-green-400">Low Priority</p>
          <p>{pendingCounts.lowPriority}</p>
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}
