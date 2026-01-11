import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeroButton } from "@/components/ui/button-variants";
import { QrCode, Eye, EyeOff, Upload, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return { ...checks, isValid: Object.values(checks).every(Boolean) };
  };

  const passwordValidation = validatePassword(formData.password);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword !== "";

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Logo size should be less than 5MB');
        return;
      }

      setLogo(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrorMessage("");
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!passwordValidation.isValid || !passwordsMatch) return;

    try {
      setLoading(true);

      // ✅ NEW: Send OTP to email first
      const otpResponse = await fetch(`${API_BASE_URL}/api/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          restaurantName: formData.restaurantName
        }),
      });

      const otpData = await otpResponse.json();
      setLoading(false);

      if (otpResponse.ok) {
        // Navigate to OTP verification page with signup data
        navigate("/signup-otp", {
          state: {
            email: formData.email,
            restaurantName: formData.restaurantName,
            signupData: {
              restaurantName: formData.restaurantName,
              ownerName: formData.ownerName,
              email: formData.email,
              password: formData.password,
              logo: logo // Pass logo file
            }
          }
        });
      } else {
        setErrorMessage(otpData.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("Network error:", err);
      setErrorMessage("Network error. Please try again later.");
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            Create your account
          </h1>
          <p className="text-muted-foreground">
            Start creating QR menus in minutes
          </p>
        </div>

        {/* Signup Form */}
        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Restaurant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  placeholder="Enter your restaurant name"
                  value={formData.restaurantName}
                  onChange={(e) =>
                    handleInputChange("restaurantName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Enter your full name"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  required
                />
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="logo">
                  Restaurant Logo <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>

                {!logoPreview ? (
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label htmlFor="logo" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative border-2 border-muted rounded-lg p-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-cover rounded mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="text-xs space-y-1 mt-2">
                    <p className={passwordValidation.length ? "text-green-600" : "text-muted-foreground"}>
                      ✓ At least 8 characters
                    </p>
                    <p className={passwordValidation.uppercase ? "text-green-600" : "text-muted-foreground"}>
                      ✓ One uppercase letter
                    </p>
                    <p className={passwordValidation.number ? "text-green-600" : "text-muted-foreground"}>
                      ✓ One number
                    </p>
                    <p className={passwordValidation.special ? "text-green-600" : "text-muted-foreground"}>
                      ✓ One special character
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={passwordsMatch ? "text-green-600 text-xs" : "text-red-500 text-xs"}>
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
                  </p>
                )}
              </div>

              <HeroButton
                type="submit"
                className="w-full"
                disabled={
                  loading || !passwordValidation.isValid || !passwordsMatch
                }
              >
                {loading ? "Sending OTP..." : "Continue to Email Verification"}
              </HeroButton>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;