import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeroButton } from "@/components/ui/button-variants";
import { QrCode, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/config";

const SignupOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const restaurantName = location.state?.restaurantName;
  const signupData = location.state?.signupData;

  // Redirect if no data
  useEffect(() => {
    if (!email || !signupData) {
      navigate("/signup");
    }
  }, [email, signupData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Verify OTP
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.message || "Invalid OTP");
        setLoading(false);
        return;
      }

      // Step 2: Complete registration with verified OTP
      const formDataToSend = new FormData();
      formDataToSend.append('restaurantName', signupData.restaurantName);
      formDataToSend.append('name', signupData.ownerName);
      formDataToSend.append('email', signupData.email);
      formDataToSend.append('password', signupData.password);
      formDataToSend.append('otp', otp); // Include OTP for final verification

      if (signupData.logo) {
        formDataToSend.append('logo', signupData.logo);
      }

      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: formDataToSend,
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        setShowSuccessDialog(true);
      } else {
        setError(registerData.message || "Registration failed");
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
      const response = await fetch(`${API_BASE_URL}/api/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, restaurantName }),
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
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Form */}
        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Email Verification
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
                  OTP expires in 10 minutes
                </p>
              </div>

              {/* Error message */}
              {error && <p className="text-destructive text-sm">{error}</p>}

              <HeroButton
                type="submit"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Complete Signup"}
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
                  to="/signup"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Signup
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        if (!open) navigate("/login");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              Verification Successful
            </DialogTitle>
            <DialogDescription className="text-center">
              Your email has been verified and your account is ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center">
            <Button
              className="w-full sm:w-auto min-w-[120px]"
              onClick={() => navigate("/login")}
            >
              Proceed to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignupOTP;