import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, PhoneCall, AlertCircle } from "lucide-react";
import { sendOTP, verifyOTP } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("mobile"); // 'mobile' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState(""); // For demo purposes

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate mobile number
      if (!/^\d{10}$/.test(mobile)) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }

      const response = await sendOTP(mobile);
      setDemoOtp(response.otp); // Store for demo display
      setOtpSent(true);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      const response = await verifyOTP(mobile, otp);

      // Login user with token
      login(response.user, response.token, response.refresh);

      // Redirect based on role
      if (response.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setOtp("");
    try {
      const response = await sendOTP(mobile);
      setDemoOtp(response.otp);
      setError("");
      alert("OTP resent successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SafeNow</h1>
          <p className="text-gray-400 text-lg">Your Safety, Our Priority</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 shadow-2xl">
          {step === "mobile" ? (
            <form onSubmit={handleSendOTP}>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-400 mb-6">
                Enter your mobile number to get started
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneCall className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="9876543210"
                    className="input-field pl-12"
                    maxLength="10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Admin demo account: 9876543210 (OTP: 000000)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-gray-400 mb-6">
                Enter the 6-digit code sent to{" "}
                <span className="text-white font-semibold">{mobile}</span>
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Demo OTP Display */}
              {demoOtp && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
                  <p className="text-blue-400 text-sm font-mono">
                    <span className="font-semibold">Demo OTP:</span> {demoOtp}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className="input-field text-center text-2xl tracking-widest"
                  maxLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                    setError("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-primary-500 hover:text-primary-400 transition-colors font-semibold"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
