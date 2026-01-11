import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { API_BASE_URL } from "@/config";
const API_BASE = `${API_BASE_URL}/api`;

// TypeScript Interfaces
interface StaffMember {
  _id?: string;
  id?: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "waiter" | "chef" | "manager" | "cashier";
  shift?: string;
  isActive: boolean;
  createdAt?: string;
  lastLogin?: Date | null;
  restaurantId: string;
}

interface FormData {
  username?: string;
  fullName?: string;
  password?: string;
  email?: string;
  phone?: string;
  role?: string;
  shift?: string;
  isActive?: boolean;
}

const StaffManagementPage = () => {
  // State Management
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<{ id: string, name: string } | null>(null);

  // Check if user is a manager (staff) or owner
  useEffect(() => {
    const staffToken = localStorage.getItem("staffToken");
    const staffData = localStorage.getItem("staffData");
    if (staffToken && staffData) {
      try {
        const parsed = JSON.parse(staffData);
        setIsManager(parsed.role === "manager");
      } catch (e) {
        setIsManager(false);
      }
    }
  }, []);

  // Get appropriate token from localStorage (owner token or staff token)
  const getAuthHeader = () => {
    // Check for staff token first (manager access)
    const staffToken = localStorage.getItem("staffToken");
    if (staffToken) {
      console.log("Using staff token for authentication");
      return { Authorization: `Bearer ${staffToken}` };
    }
    // Fallback to owner token
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found in localStorage");
      console.log("Available localStorage keys:", Object.keys(localStorage));
      return { Authorization: "" };
    }
    console.log("Using owner token for authentication");
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch staff data
  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();

      // Debug: Check if token exists
      if (!headers.Authorization || headers.Authorization === "Bearer null" || headers.Authorization === "Bearer undefined") {
        console.error("No valid token found. Please login again.");
        toast.error("Authentication required. Please login again.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/staff/list`, {
        headers: headers,
      });

      if (response.data.success) {
        setStaffData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to load staff data"
        : "Failed to load staff data";
      toast.error(errorMessage);

      // If 401, suggest re-login
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error("Authentication failed. Token may be expired or invalid.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    fetchRestaurantInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch restaurant info
  const fetchRestaurantInfo = async () => {
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) return;

      const isStaff = !!localStorage.getItem("staffToken");
      const endpoint = isStaff ? `${API_BASE}/staff/auth/me` : `${API_BASE}/auth/me`;

      const response = await axios.get(endpoint, { headers });

      if (response.data.success) {
        if (isStaff) {
          // Staff endpoint structure
          const rest = response.data.data.restaurantId;
          setRestaurantInfo({
            id: rest._id,
            name: rest.restaurantName
          });
        } else {
          // Owner endpoint structure
          const rest = response.data.restaurant;
          if (rest) {
            setRestaurantInfo({
              id: rest.id,
              name: rest.restaurantName
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch restaurant info:", error);
    }
  };

  // Calculated Stats
  const totalStaff = staffData.length;
  const activeStaff = staffData.filter((s) => s.isActive).length;
  const inactiveStaff = staffData.filter((s) => !s.isActive).length;
  const roleBreakdown = staffData.reduce((acc, staff) => {
    acc[staff.role] = (acc[staff.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtered Staff Data
  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && staff.isActive) ||
      (filterStatus === "inactive" && !staff.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Generate username from full name
  const generateUsername = (fullName: string) => {
    const baseUsername = fullName
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");

    let username = baseUsername;
    let isUnique = false;

    while (!isUnique) {
      // eslint-disable-next-line no-loop-func
      const exists = staffData.some((staff) => staff.username === username);
      if (!exists) {
        isUnique = true;
      } else {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        username = `${baseUsername}.${randomSuffix}`;
      }
    }

    return username;
  };

  // Generate random password
  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handler: Add Staff
  const handleAddStaff = async () => {
    if (!formData.fullName || !formData.role || !formData.password || !formData.email) {
      toast.error("Please fill all required fields including Email");
      return;
    }

    setIsSubmitting(true);
    try {
      const username = formData.username || generateUsername(formData.fullName);

      const response = await axios.post(
        `${API_BASE}/staff/create`,
        {
          username,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          email: formData.email || null,
          phone: formData.phone || null,
          shift: formData.shift || "flexible",
        },
        {
          headers: getAuthHeader(),
        }
      );

      if (response.data.success) {
        toast.success("Staff member added and credentials sent to email successfully");
        toast.info(`Username: ${username} | Password: ${formData.password}`, {
          duration: 10000,
        });
        setIsAddDialogOpen(false);
        setFormData({});
        fetchStaffData();
      }
    } catch (error) {
      console.error("Failed to add staff:", error);
      toast.error(error.response?.data?.message || "Failed to add staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Edit Staff
  const handleEditStaff = async () => {
    if (!selectedStaff || !formData.fullName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const staffId = selectedStaff._id || selectedStaff.id;
      const response = await axios.put(
        `${API_BASE}/staff/${staffId}`,
        {
          fullName: formData.fullName,
          email: formData.email || null,
          phone: formData.phone || null,
          shift: formData.shift,
          isActive: formData.isActive,
          ...(formData.password && { password: formData.password }),
        },
        {
          headers: getAuthHeader(),
        }
      );

      if (response.data.success) {
        toast.success("Staff member updated successfully");
        if (formData.password) {
          toast.info(`New password: ${formData.password}`, { duration: 10000 });
        }
        setIsEditDialogOpen(false);
        setSelectedStaff(null);
        setFormData({});
        fetchStaffData();
      }
    } catch (error) {
      console.error("Failed to update staff:", error);
      toast.error(error.response?.data?.message || "Failed to update staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Delete Staff
  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${staff.fullName}?`)) {
      return;
    }

    try {
      const staffId = staff._id || staff.id;
      const response = await axios.delete(`${API_BASE}/staff/${staffId}`, {
        headers: getAuthHeader(),
      });

      if (response.data.success) {
        toast.success("Staff member deleted successfully");
        fetchStaffData();
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast.error(error.response?.data?.message || "Failed to delete staff member");
    }
  };

  // Open dialogs
  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      fullName: staff.fullName,
      email: staff.email || "",
      phone: staff.phone || "",
      shift: staff.shift || "flexible",
      isActive: staff.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openProfileDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsProfileDialogOpen(true);
  };

  const handleGenerateCredentials = () => {
    const username = formData.fullName
      ? generateUsername(formData.fullName)
      : generateUsername("user");
    const password = generatePassword();

    setFormData({
      ...formData,
      username,
      password,
    });

    toast.success("Credentials generated! Make sure to save them.", {
      duration: 5000,
    });
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      waiter: "Waiter",
      chef: "Chef",
      manager: "Manager",
      cashier: "Cashier",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Staff Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your team members and their access
          </p>
          {restaurantInfo && (
            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
              <span className="font-semibold">Restaurant ID:</span>
              <code className="bg-background px-1 rounded border">{restaurantInfo.id}</code>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchStaffData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {!isManager && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>
                    Create a new staff account with login credentials
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role || ""}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiter">Waiter</SelectItem>
                          <SelectItem value="chef">Chef</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@restaurant.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 234 567 8900"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shift">Shift</Label>
                    <Select
                      value={formData.shift || "flexible"}
                      onValueChange={(value) => setFormData({ ...formData, shift: value })}
                    >
                      <SelectTrigger id="shift">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold">Login Credentials</h4>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateCredentials}
                      className="w-full"
                      disabled={!formData.fullName}
                    >
                      Generate Username & Password
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          placeholder="john.doe"
                          value={formData.username || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="text"
                          placeholder="Generated password"
                          value={formData.password || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Save these credentials! They will be shown only once.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setFormData({});
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddStaff} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Staff Member"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveStaff}</div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(roleBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(roleBreakdown)
                .map(([role, count]) => `${count} ${getRoleDisplay(role)}`)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Staff Table - Desktop */}
      {!isLoading && (
        <Card className="hidden md:block">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No staff members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff._id || staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {staff.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                @{staff.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoleDisplay(staff.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {staff.email && <div>{staff.email}</div>}
                            {staff.phone && (
                              <div className="text-muted-foreground">{staff.phone}</div>
                            )}
                            {!staff.email && !staff.phone && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {staff.shift || "Flexible"}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(staff.isActive)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openProfileDialog(staff)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(staff)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isManager && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStaff(staff)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Cards - Mobile */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No staff members found
              </CardContent>
            </Card>
          ) : (
            filteredStaff.map((staff) => (
              <Card key={staff._id || staff.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {staff.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{staff.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          @{staff.username}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(staff.isActive)}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline">{getRoleDisplay(staff.role)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shift:</span>
                      <span className="font-medium capitalize">
                        {staff.shift || "Flexible"}
                      </span>
                    </div>
                    {(staff.email || staff.phone) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-xs">
                          {staff.email && <div>{staff.email}</div>}
                          {staff.phone && (
                            <div className="text-muted-foreground">{staff.phone}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openProfileDialog(staff)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(staff)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {!isManager && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-shift">Shift</Label>
              <Select
                value={formData.shift || "flexible"}
                onValueChange={(value) => setFormData({ ...formData, shift: value })}
              >
                <SelectTrigger id="edit-shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isManager && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Account Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive accounts cannot login
                  </p>
                </div>
                <Button
                  variant={formData.isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                >
                  {formData.isActive ? "Active" : "Inactive"}
                </Button>
              </div>
            )}
            {isManager && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label>Account Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.isActive ? "Active" : "Inactive"} (Read-only)
                  </p>
                </div>
                <Badge variant={formData.isActive ? "default" : "secondary"}>
                  {formData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            )}

            {!isManager && (
              <div className="border-t pt-4 space-y-2">
                <Label htmlFor="edit-password">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  type="text"
                  placeholder="Leave blank to keep current password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, password: generatePassword() })}
                >
                  Generate New Password
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setFormData({});
                setSelectedStaff(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Profile</DialogTitle>
            <DialogDescription>Detailed staff member information</DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {selectedStaff.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStaff.fullName}</h3>
                  <p className="text-muted-foreground">
                    {getRoleDisplay(selectedStaff.role)}
                  </p>
                  {getStatusBadge(selectedStaff.isActive)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Username</Label>
                  <p className="font-medium text-sm">@{selectedStaff.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Shift</Label>
                  <p className="font-medium text-sm capitalize">
                    {selectedStaff.shift || "Flexible"}
                  </p>
                </div>
                {selectedStaff.email && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium text-sm">{selectedStaff.email}</p>
                  </div>
                )}
                {selectedStaff.phone && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium text-sm">{selectedStaff.phone}</p>
                  </div>
                )}
                {selectedStaff.createdAt && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Join Date</Label>
                    <p className="font-medium text-sm">
                      {new Date(selectedStaff.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedStaff.lastLogin && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Last Login</Label>
                    <p className="font-medium text-sm">
                      {new Date(selectedStaff.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagementPage;