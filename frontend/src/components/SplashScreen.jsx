import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out animation after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete splash screen after fade out animation (2.5 seconds total)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8 animate-bounce">
          <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-full animate-pulse" />
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/50 transform hover:scale-110 transition-transform duration-300">
            <Shield className="w-20 h-20 text-white animate-pulse" />
          </div>
        </div>

        {/* App Name with Gradient */}
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent animate-pulse">
          SafeNow
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-lg mb-6">Your Safety, Our Priority</p>

        {/* Loading Animation */}
        <div className="flex justify-center gap-2">
          <div
            className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
