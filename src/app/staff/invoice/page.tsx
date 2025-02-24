"use client";
import axios from "axios";
import { toast } from "react-toastify";
import { serverURL } from "../../../utils/utils";
import {
  FiFileText,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiCalendar,
  FiSearch,
  FiEye,
  FiDownloadCloud,
  FiX,
  FiDollarSign,
  FiClock,
  FiUser,
  FiMail,
  FiHash,
  FiCreditCard,
} from "react-icons/fi";
import React, { useEffect, useState } from "react";
import moment from "moment";

// Types and Interfaces
interface Invoice {
  _id: string;
  invoiceId: string;
  purchaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  itemId: string;
  amount: number;
  taxPercent: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  productPrice: number;
  creditLimit: number;
}

interface Filters {
  startDate: string;
  endDate: string;
  userId: string;
  currency: string;
  invoiceIdPrefix: string;
  year: string;
}

interface DownloadFilters {
  year: string;
  month: string;
  currency: string;
  startDate: string;
  endDate: string;
}

export default function InvoicesPage() {
  // State Management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<Filters>({
    startDate: "",
    endDate: "",
    userId: "",
    currency: "",
    invoiceIdPrefix: "",
    year: new Date().getFullYear().toString(),
  });
  const [downloadFilters, setDownloadFilters] = useState<DownloadFilters>({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    currency: "",
    startDate: "",
    endDate: "",
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadType, setDownloadType] = useState<"monthly" | "custom">(
    "monthly"
  );

  // Fetch Invoices Function
  const fetchInvoices = async (page: number, filterParams = {}) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${serverURL}/admin/invoices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params: {
          page,
          limit: 10,
          ...filterParams,
        },
      });

      setInvoices(response.data.invoiceData);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setTotalInvoices(response.data.totalInvoices);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  // Handler Functions
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownloadFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setDownloadFilters({ ...downloadFilters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    const validFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    fetchInvoices(1, validFilters);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      userId: "",
      currency: "",
      invoiceIdPrefix: "",
      year: new Date().getFullYear().toString(),
    });
    fetchInvoices(1);
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchInvoices(newPage, filters);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchInvoices(1, { ...filters, searchQuery });
    }
  };

  const downloadInvoices = async (params: Partial<DownloadFilters> = {}) => {
    setIsLoading(true);
    try {
      console.log(params);
      const response = await axios.post(
        `${serverURL}/admin/download-invoices`,
        params,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);

      // Create filename based on filters
      const year = params.year || new Date().getFullYear();
      const month = params.month
        ? new Date(2000, parseInt(params.month) - 1).toLocaleString("default", {
            month: "long",
          })
        : null;
      const currency = params.currency || "ALL";

      link.download = `invoices_${year}${
        month ? "_" + month : ""
      }_${currency}.csv`;
      link.click();
      toast.success("Invoices downloaded successfully");
    } catch (error) {
      toast.error("Error downloading invoices");
    } finally {
      setIsLoading(false);
      setIsDownloadModalOpen(false);
    }
  };

  const downloadSingleInvoice = async (invoiceId: string) => {
    try {
      const response = await axios.get(
        `${serverURL}/admin/download-invoice/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${invoiceId}.pdf`;
      link.click();
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Error downloading invoice");
    }
  };

  // Modal Components
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Filter Invoices</h3>
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="text-gray-400 hover:text-white transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={filters.currency}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">All Currencies</option>
              <option value="NPR">NPR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Invoice ID Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Invoice ID Prefix
            </label>
            <input
              type="text"
              name="invoiceIdPrefix"
              value={filters.invoiceIdPrefix}
              onChange={handleFilterChange}
              placeholder="e.g., INV-2024"
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-x-4 mt-6">
          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="px-4 py-[6px] bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition"
          >
            Reset
          </button>

          {/* Apply Filters Button */}
          <button
            onClick={applyFilters}
            className="px-4 py-[6px] bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
  
  const DownloadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Download Invoices
          </h3>
          <button
            onClick={() => setIsDownloadModalOpen(false)}
            className="text-gray-400 hover:text-white transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-6">
          {/* Download Type Selection */}
          <div className="flex gap-4">
            <button
              onClick={() => setDownloadType("monthly")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                downloadType === "monthly"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } transition`}
            >
              <FiCalendar size={18} className="inline-block mr-2" /> Monthly
            </button>
            <button
              onClick={() => setDownloadType("custom")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                downloadType === "custom"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } transition`}
            >
              <FiClock size={18} className="inline-block mr-2" /> Custom Range
            </button>
          </div>

          {/* Conditional Inputs Based on Download Type */}
          {downloadType === "monthly" ? (
            <div className="space-y-4">
              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Year
                </label>
                <select
                  name="year"
                  value={downloadFilters.year}
                  onChange={handleDownloadFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Month
                </label>
                <select
                  name="month"
                  value={downloadFilters.month}
                  onChange={handleDownloadFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={downloadFilters.startDate}
                  onChange={handleDownloadFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={downloadFilters.endDate}
                  onChange={handleDownloadFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={downloadFilters.currency}
              onChange={handleDownloadFilterChange}
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">All Currencies</option>
              <option value="NPR">NPR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-x-[10px] mt-[30px]">
          {/* Cancel Button */}
          <button
            onClick={() => setIsDownloadModalOpen(false)}
            className="px-[14px] py-[8px] bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition"
          >
            Cancel
          </button>

          {/* Download Button */}
          <button
            onClick={() => {
              const params =
                downloadType === "monthly"
                  ? {
                      year: downloadFilters.year,
                      month: downloadFilters.month,
                      currency: downloadFilters.currency,
                    }
                  : {
                      startDate: downloadFilters.startDate,
                      endDate: downloadFilters.endDate,
                      currency: downloadFilters.currency,
                    };
              downloadInvoices(params);
              setIsDownloadModalOpen(false);
            }}
            className="px-[14px] py-[8px] bg-green-500 hover:bg-green-600 text-white rounded-md font-medium flex items-center gap-x-[6px] transition"
          >
            <FiDownloadCloud size={18} /> Download
          </button>
        </div>
      </div>
    </div>
  );

  const ViewInvoiceModal = ({ invoice }: { invoice: Invoice }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl w-[600px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Invoice Details</h3>
          <button
            onClick={() => setIsViewModalOpen(false)}
            className="btn btn-ghost btn-circle"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Invoice ID</p>
                <p className="font-semibold">{invoice.invoiceId}</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-semibold">
                  {moment(invoice.date).format("YYYY-MM-DD")}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="font-semibold">{invoice.paymentMethod}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Amount Details</h4>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Amount</p>
                <p className="font-semibold">
                  {invoice.amount?.toLocaleString()} {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Tax ({invoice.taxPercent}%)</p>
                <p className="font-semibold">
                  {(
                    (invoice.amount * invoice.taxPercent) /
                    100
                  ).toLocaleString()}{" "}
                  {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Amount</p>
                <p className="font-semibold text-lg text-green-400">
                  {invoice.totalAmount?.toLocaleString()} {invoice.currency}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <h4 className="text-lg font-semibold mb-4">User Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">From</p>
                <p className="font-semibold">{invoice.fromName}</p>
                <p className="text-sm text-gray-400">{invoice.fromEmail}</p>
              </div>
              <div>
                <p className="text-gray-400">To</p>
                <p className="font-semibold">{invoice.toName}</p>
                <p className="text-sm text-gray-400">{invoice.toEmail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => downloadSingleInvoice(invoice._id)}
            className="btn btn-primary"
          >
            <FiDownloadCloud className="mr-2" /> Download PDF
          </button>
          <button
            onClick={() => setIsViewModalOpen(false)}
            className="btn btn-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Page Wrapper */}
      <main className="min-h-screen bg-gray-900 text-white p-6">
        {/* Container */}
        <section className="max-w-screen-xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4 bg-gray-800 p-6 rounded-lg shadow-md">
            {/* Title */}
            <h1 className="text-white text-3xl font-bold flex items-center gap-x-3">
              <FiFileText size={28} className="text-blue-400" /> Invoices
              Management
            </h1>

            {/* Actions */}
            <form
              onSubmit={handleSearch}
              autoComplete="off"
              role="search"
              className="flex flex-col md:flex-row items-stretch gap-4 w-full md:w-auto"
            >
              {/* Search Bar */}
              <div className="relative flex-grow">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by user or invoice ID"
                  required
                  minLength={3}
                  maxLength={255}
                  className="w-full px-4 py-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-500 placeholder-gray-500"
                />
                <FiSearch
                  size={20}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {/* Filters Button */}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="flex items-center gap-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium transition"
                >
                  <FiFilter size={18} /> Filters
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="flex items-center gap-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition"
                >
                  <FiDownloadCloud size={18} /> Download
                </button>
              </div>
            </form>
          </header>
          {/* Active Filters */}
          {Object.values(filters).some((value) => value !== "") && (
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value) {
                    return (
                      <span
                        key={key}
                        className="badge badge-info flex items-center gap-1"
                      >
                        {key}: {value}
                        <button
                          onClick={() => {
                            const newFilters = { ...filters };
                            newFilters[key as keyof Filters] = "";
                            setFilters(newFilters);
                            applyFilters();
                          }}
                          className="text-white hover:text-red-400"
                        >
                          <FiX />
                        </button>
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
          {/* Invoices Table */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : invoices.length > 0 ? (
              <>
                <table className="table-auto w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-700 text-gray-300">
                      <th className="py-3 px-4 border-b border-gray-600">#</th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Invoice Info
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Amount
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Total Amount
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Currency
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Payment Method
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Date
                      </th>
                      <th className="py-3 px-4 border-b border-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => (
                      <tr
                        key={invoice._id}
                        className={`${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                        } hover:bg-gray-600 transition-colors`}
                      >
                        <td className="py-3 px-4">
                          {(currentPage - 1) * 10 + index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <strong>{invoice.invoiceId}</strong>
                          <br />
                          {invoice.userName} ({invoice.userEmail})
                        </td>
                        <td className="py-3 px-4">
                          {invoice.amount?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {invoice.totalAmount?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="py-3 px-4">{invoice.currency}</td>
                        <td className="py-3 px-4">{invoice.paymentMethod}</td>
                        <td className="py-3 px-4">
                          {moment(invoice.date).format("YYYY-MM-DD")}
                        </td>
                        <td className="py-3 px-4 flex gap-x-2">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsViewModalOpen(true);
                            }}
                            title={"View Details"}
                            className={
                              "px-2 py-[6px] bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition"
                            }
                          >
                            View
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => downloadSingleInvoice(invoice._id)}
                            title={"Download PDF"}
                            className={
                              "px-2 py-[6px] bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition"
                            }
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    {/* Pagination Info */}
                    <span className="text-sm text-gray-400">
                      Showing {(currentPage - 1) * 10 + 1} to{" "}
                      {Math.min(currentPage * 10, totalInvoices)} of{" "}
                      {totalInvoices} invoices
                    </span>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-x-[6px]">
                      {/* Previous Page */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        title={"Previous Page"}
                        className={`px-[10px] py-[6px] text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        Previous
                      </button>

                      {/* Current Page Info */}
                      <span
                        className={
                          "px-[10px] py-[6px] bg-gray-700 text-white rounded-md font-medium"
                        }
                      >
                        Page {currentPage} of {totalPages}
                      </span>

                      {/* Next Page */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        title={"Next Page"}
                        className={`px-[10px] py-[6px] text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // No Data Found Message
              <p className="text-center text-gray-400">No invoices found.</p>
            )}
          </div>
          {/* Modals */}
          {isFilterModalOpen && <FilterModal />}
          {isDownloadModalOpen && <DownloadModal />}
          {isViewModalOpen && selectedInvoice && (
            <ViewInvoiceModal invoice={selectedInvoice} />
          )}
        </section>
      </main>
    </>
  );
}
