import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import { API_BASE_URL } from "@/config";
const API_BASE = `${API_BASE_URL}/api`;

const StaffLogin = () => {
  const { staffRole } = useParams<{
    staffRole: string;
  }>();
  const navigate = useNavigate();
  // Using URLSearchParams directly to avoid adding new import if not needed, 
  // but react-router-dom's useSearchParams is better. 
  // checking imports: import { useParams, useNavigate } from "react-router-dom";
  // I will change the import line in a separate edit or just use window.location which is simpler for now, 
  // but let's do it properly with `useSearchParams`.
  // Wait, I can just modify the import line in the same REPLACE block if I include it? 
  // No, the target content must be contiguous.
  // I'll use window.location.search for simplicity to avoid multi-edit complexity or just use a second edit for import.
  // Actually, I'll allow myself to use window.location.search inside a useEffect.

  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with URL params if available
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      username: "",
      password: "",
      restaurantId: params.get("restaurantId") || "",
    };
  });

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      waiter: "Waiter/Server",
      chef: "Chef/Kitchen",
      manager: "Manager",
      cashier: "Cashier",
    };
    return roleMap[role] || role;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.restaurantId) {
      toast({
        title: "Validation Error",
        description: "Please enter username, password, and restaurant ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending login request with:", {
        username: formData.username.trim(),
        restaurantId: formData.restaurantId.trim(),
        restaurantIdLength: formData.restaurantId.trim().length,
      });

      const response = await axios.post(`${API_BASE}/staff/login`, {
        username: formData.username.trim(),
        password: formData.password,
        restaurantId: formData.restaurantId.trim(),
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        const { token, staff } = response.data;

        // Verify the role matches the URL
        if (staff.role !== staffRole) {
          toast({
            title: "Access Denied",
            description: `You are a ${staff.role}, not a ${staffRole}. Please use the correct login page.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Store authentication data
        localStorage.setItem("staffToken", token);
        localStorage.setItem("staffData", JSON.stringify(staff));

        toast({
          title: "Login successful",
          description: `Welcome ${staff.fullName}!`,
        });

        // Navigate to role-specific dashboard
        navigate(`/staff/${staff.role}/dashboard`);
      }
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Login failed. Please check your credentials.";

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Restaurant Staff Portal
          </h1>
          <p className="text-muted-foreground">Staff Login</p>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl">Staff Login</CardTitle>
            <CardDescription>
              Sign in as{" "}
              <span className="font-semibold text-foreground">
                {getRoleName(staffRole || "")}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantId">Restaurant ID</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="restaurantId"
                    name="restaurantId"
                    type="text"
                    placeholder="Enter your restaurant ID"
                    value={formData.restaurantId}
                    onChange={handleInputChange}
                    className="pl-10 font-mono"
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  24-character restaurant ID provided by your manager
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    autoComplete="username"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact your manager</p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;