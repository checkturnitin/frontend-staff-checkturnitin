"use client";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { serverURL } from "../../../utils/utils";
import { 
  FiUser, 
  FiUsers, 
  FiFilter,   
  FiX, 
  FiChevronLeft, 
  FiChevronRight,
  FiCreditCard,
  FiShoppingBag,
  FiCalendar,
  FiMail,
  FiSearch
} from "react-icons/fi";
import React, { useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  creditBalance: number;
  totalPurchases: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Filters {
  email: string;
  minCredits: string;
  maxCredits: string;
  minPurchases: string;
  maxPurchases: string;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>({
    email: "",
    minCredits: "",
    maxCredits: "",
    minPurchases: "",
    maxPurchases: "",
    status: "",
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async (page: number, filterParams = {}) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...filterParams,
        ...(searchQuery && { email: searchQuery })
      };

      const response = await axios.get(`${serverURL}/admin/users/filter`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params
      });

      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setTotalUsers(response.data.totalUsers);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    const validFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    setCurrentPage(1);
    fetchUsers(1, validFilters);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      email: "",
      minCredits: "",
      maxCredits: "",
      minPurchases: "",
      maxPurchases: "",
      status: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
    fetchUsers(1);
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const validFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      fetchUsers(newPage, validFilters);
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const validFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    fetchUsers(1, validFilters);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FiUsers className="mr-2" /> Users Management
              </h1>
              <p className="text-gray-400 mt-1">
                Total Users: {totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email..."
                  className="input input-bordered bg-gray-700 w-full sm:w-64"
                />
                <button type="submit" className="btn btn-primary">
                  <FiSearch />
                </button>
              </form>
              {/* Filter Button */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="btn btn-secondary"
              >
                <FiFilter className="mr-2" /> Filters
              </button>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-gray-700">#</th>
                    <th className="bg-gray-700">User Info</th>
                    <th className="bg-gray-700">Credits Balance</th>
                    <th className="bg-gray-700">Total Purchases</th>
                    <th className="bg-gray-700">Status</th>
                    <th className="bg-gray-700">Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id} className="hover:bg-gray-700">
                      <td>{(currentPage - 1) * 10 + index + 1}</td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="avatar placeholder">
                            <div className="bg-blue-700 text-white rounded-full w-10 h-10">
                              <span className="text-xl">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{user.name}</div>
                            <Link
                              href={`mailto:${user.email}`}
                              className="text-sm text-gray-400 hover:text-blue-400"
                            >
                              <FiMail className="inline mr-1" />
                              {user.email}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <FiCreditCard className="text-blue-400" />
                          <span className="font-medium">
                            {user.creditBalance?.toLocaleString() ?? 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <FiShoppingBag className="text-green-400" />
                          <span className="font-medium">
                            {user.totalPurchases?.toLocaleString() ?? 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          user.status === 'active' 
                            ? 'badge-success' 
                            : 'badge-error'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-gray-400" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && users.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-400">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-ghost"
                >
                  <FiChevronLeft />
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm btn-ghost"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!isLoading && users.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filter Users</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email Filter */}
              <div>
                <label className="label">
                  <span className="label-text text-gray-300">Email</span>
                </label>
                <input
                  type="text"
                  name="email"
                  placeholder="Filter by email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  className="input input-bordered w-full bg-gray-700"
                />
              </div>

              {/* Credits Range */}
              <div>
                <label className="label">
                  <span className="label-text text-gray-300">Credits Range</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minCredits"
                    placeholder="Min"
                    value={filters.minCredits}
                    onChange={handleFilterChange}
                    className="input input-bordered w-1/2 bg-gray-700"
                  />
                  <input
                    type="number"
                    name="maxCredits"
                    placeholder="Max"
                    value={filters.maxCredits}
                    onChange={handleFilterChange}
                    className="input input-bordered w-1/2 bg-gray-700"
                  />
                </div>
              </div>

              {/* Purchases Range */}
              <div>
                <label className="label">
                  <span className="label-text text-gray-300">Purchases Range</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPurchases"
                    placeholder="Min"
                    value={filters.minPurchases}
                    onChange={handleFilterChange}
                    className="input input-bordered w-1/2 bg-gray-700"
                  />
                  <input
                    type="number"
                    name="maxPurchases"
                    placeholder="Max"
                    value={filters.maxPurchases}
                    onChange={handleFilterChange}
                    className="input input-bordered w-1/2 bg-gray-700"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="label">
                  <span className="label-text text-gray-300">Status</span>
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="select select-bordered w-full bg-gray-700"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={applyFilters}
                  className="btn btn-primary flex-1"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="btn btn-outline flex-1"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}