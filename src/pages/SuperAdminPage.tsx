import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    CheckCircle,
    XCircle,
    Search,
    Loader2,
    Shield,
    Clock,
    Building2,
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useToast } from "@/components/ui/use-toast";

interface UserData {
    id: string;
    name: string;
    email: string;
    isApproved: boolean;
    isSuperAdmin: boolean;
    createdAt: string;
    lastLogin: string | null;
    restaurant: {
        id: string;
        restaurantName: string;
        logo: string | null;
    } | null;
}

interface Stats {
    totalUsers: number;
    approvedUsers: number;
    pendingUsers: number;
    superAdmins: number;
    totalRestaurants: number;
}

const SuperAdminPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Redirect if not super admin
    useEffect(() => {
        console.log("SuperAdminPage - User object:", user);
        console.log("SuperAdminPage - isSuperAdmin:", user?.isSuperAdmin);

        if (!user?.isSuperAdmin) {
            console.log("Not super admin, redirecting to dashboard");
            navigate("/dashboard");
        }
    }, [user, navigate]);

    // Fetch users and stats
    const fetchData = async () => {
        try {
            setLoading(true);

            const [usersRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                console.log("SuperAdminPage: Received users data:", usersData);
                if (usersData.success) {
                    setUsers(usersData.data);
                }
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.data);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to load data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.isSuperAdmin) {
            fetchData();
        }
    }, [user]);

    // Approve user
    const handleApprove = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/approve`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "User approved successfully",
                });
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve user",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Disable user
    const handleDisable = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/disable`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "User disabled successfully",
                });
                fetchData();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to disable user",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Filter users
    const filteredUsers = users.filter(
        (u) =>
            (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.restaurant?.restaurantName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    if (!user?.isSuperAdmin) {
        return null;
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="h-7 w-7 text-primary" />
                        Super Admin Panel
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage user access and approvals</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                                </div>
                                <Users className="h-8 w-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                    <p className="text-2xl font-bold text-success">{stats.approvedUsers}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-success opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-warning">{stats.pendingUsers}</p>
                                </div>
                                <Clock className="h-8 w-8 text-warning opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Super Admins</p>
                                    <p className="text-2xl font-bold text-primary">{stats.superAdmins}</p>
                                </div>
                                <Shield className="h-8 w-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Restaurants</p>
                                    <p className="text-2xl font-bold">{stats.totalRestaurants}</p>
                                </div>
                                <Building2 className="h-8 w-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle>All Users</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                {u.restaurant?.restaurantName || "No Restaurant"}
                                            </TableCell>
                                            <TableCell>{u.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {u.isSuperAdmin ? (
                                                    <Badge className="bg-primary">Super Admin</Badge>
                                                ) : u.isApproved ? (
                                                    <Badge className="bg-success">Approved</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-warning border-warning">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!u.isSuperAdmin && (
                                                    <div className="flex justify-end gap-2">
                                                        {!u.isApproved ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApprove(u.id)}
                                                                disabled={actionLoading === u.id}
                                                                className="bg-success hover:bg-success/90"
                                                            >
                                                                {actionLoading === u.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Approve
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDisable(u.id)}
                                                                disabled={actionLoading === u.id}
                                                            >
                                                                {actionLoading === u.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Disable
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdminPage;
