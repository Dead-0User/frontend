import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeroButton } from "@/components/ui/button-variants";
import { QrCode, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Navigate to OTP verification page after 2 seconds
        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 2000);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">QRMenu</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Forgot Password?
          </h1>
          <p className="text-muted-foreground">
            Enter your email to receive an OTP
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-smooth focus:ring-primary"
                  disabled={loading}
                  required
                />
              </div>

              {/* Error message */}
              {error && <p className="text-destructive text-sm">{error}</p>}

              {/* Success message */}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <HeroButton type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </HeroButton>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;