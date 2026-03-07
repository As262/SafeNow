import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Bell,
  Shield,
  Globe,
  Save,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { updateUserProfile } from "../utils/api";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const [saved, setSaved] = useState(false);
  const t = translations[language].settings;
  const tCommon = translations[language].common;

  const [settings, setSettings] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "[email protected]",
    address: "123 Main Street, City",
    notifications: true,
    locationSharing: true,
    language: language,
  });

  // Update settings language when global language changes
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      language: language,
    }));
  }, [language]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If language is changed, update the global language
    if (field === "language") {
      changeLanguage(value);
    }
  };

  const handleSave = async () => {
    try {
      const profileData = {};
      if (settings.name !== user?.name) profileData.name = settings.name;
      if (settings.email !== user?.email) profileData.email = settings.email;

      if (Object.keys(profileData).length > 0) {
        const response = await updateUserProfile(profileData);
        // Update auth context and session storage with new user data
        updateUser(response.user);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert(error.message || "Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
        <p className="text-gray-400">{t.subtitle}</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <p className="text-green-400 font-semibold">{t.savedSuccess}</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          {t.profileInfo}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t.fullName}
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="input-field pl-10"
                placeholder={t.enterName}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t.mobileNumber}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={settings.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                className="input-field pl-10"
                placeholder={t.enterMobile}
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t.emailAddress}
            </label>
            <div className="relative">
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="input-field pl-10"
                placeholder={t.enterEmail}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t.address}
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="input-field pl-10"
                placeholder={t.enterAddress}
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Notifications */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          {t.privacyNotifications}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">{t.pushNotifications}</p>
                <p className="text-sm text-gray-400">{t.receiveAlerts}</p>
              </div>
            </div>
            <button
              onClick={() =>
                handleChange("notifications", !settings.notifications)
              }
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.notifications ? "bg-primary-600" : "bg-dark-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  settings.notifications ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">{t.locationSharing}</p>
                <p className="text-sm text-gray-400">{t.shareLocation}</p>
              </div>
            </div>
            <button
              onClick={() =>
                handleChange("locationSharing", !settings.locationSharing)
              }
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.locationSharing ? "bg-primary-600" : "bg-dark-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  settings.locationSharing ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          {t.appearance}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t.language}
            </label>
            <div className="relative">
              <select
                value={settings.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="input-field pl-10 appearance-none cursor-pointer"
              >
                <option value="en">{t.english}</option>
                <option value="hi">{t.hindi}</option>
              </select>
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3"
      >
        <Save className="w-5 h-5" />
        {t.saveChanges}
      </button>
    </div>
  );
};

export default Settings;
