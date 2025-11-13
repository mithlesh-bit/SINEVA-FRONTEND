"use client";

import { useState, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendOtp = async () => {
    if (!email) return setMessage("Email is required");
    setLoading(true);
    try {
      const res = await axios.post("https://sineva-backend.vercel.app/api/authusers/send-otp", { email });
      setMessage(res.data.message);
      localStorage.setItem("loginEmail", email);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const storedEmail = localStorage.getItem("loginEmail");
    if (!otp || !storedEmail) return setMessage("OTP or email missing");

    setLoading(true);
    try {
      const res = await axios.post("https://sineva-backend.vercel.app/api/authusers/validate", {
        email: storedEmail,
        otp,
      });
      const token = res.data.token;
      login({ email: storedEmail }, token);

      localStorage.removeItem("loginEmail");
      router.push("/"); 
    } catch (err) {
      setMessage(err.response?.data?.message || "Error verifying OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-6">
      <div className="w-full max-w-md p-6 sm:p-8 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">Login</h1>

        {message && (
          <p className="text-center text-red-400 text-sm sm:text-base">{message}</p>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-700/50 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-medium btn-glow hover:opacity-90 transition text-sm sm:text-base"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-700/50 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full px-5 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-full text-white font-medium btn-glow hover:opacity-90 transition text-sm sm:text-base"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}

        {/* Optional: small footer */}
        <p className="text-gray-400 text-center text-xs sm:text-sm mt-2">
          Secure login powered by OTP
        </p>
      </div>
    </div>
  );
}
