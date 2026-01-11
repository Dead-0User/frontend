import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeroButton } from "@/components/ui/button-variants";
import { QrCode, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/config";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate to reset password page
        navigate("/reset-password", { state: { email, otp } });
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("New OTP sent to your email!");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
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
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify OTP
          </h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Form */}
        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Enter OTP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="transition-smooth focus:ring-primary text-center text-2xl tracking-widest"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  OTP expires in 5 minutes
                </p>
              </div>

              {/* Error message */}
              {error && <p className="text-destructive text-sm">{error}</p>}

              <HeroButton type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify OTP"}
              </HeroButton>
            </form>

            <div className="mt-6 text-center space-y-3">
              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="text-sm text-primary hover:underline"
              >
                {resending ? "Resending..." : "Didn't receive OTP? Resend"}
              </button>

              <div>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;