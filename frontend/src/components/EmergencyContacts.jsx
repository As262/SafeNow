import { useState, useEffect } from "react";
import { Phone, Ambulance, Shield, Hospital, Users, AlertCircle, Plus, X, Edit2, Trash2, User } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";

const defaultEmergencyContacts = [
  {
    id: 1,
    name: "Emergency Services",
    number: "911",
    icon: AlertCircle,
    color: "from-red-500 to-red-700",
    description: "General emergency hotline",
  },
  {
    id: 2,
    name: "Ambulance",
    number: "1-800-AMBULANCE",
    icon: Ambulance,
    color: "from-blue-500 to-blue-700",
    description: "Medical emergency & ambulance",
  },
  {
    id: 3,
    name: "Police",
    number: "1-800-POLICE",
    icon: Shield,
    color: "from-indigo-500 to-indigo-700",
    description: "Law enforcement assistance",
  },
  {
    id: 4,
    name: "Fire Department",
    number: "1-800-FIRE",
    icon: Hospital,
    color: "from-orange-500 to-orange-700",
    description: "Fire & rescue services",
  },
  {
    id: 5,
    name: "NGO Support",
    number: "1-800-NGO-HELP",
    icon: Users,
    color: "from-purple-500 to-purple-700",
    description: "Community support services",
  },
];

const EmergencyContacts = () => {
  const { language } = useLanguage();
  const t = translations[language].contacts;
  const tCommon = translations[language].common;

  const [customContacts, setCustomContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    phoneNumber: "",
  });

  // Load custom contacts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("customEmergencyContacts");
    if (saved) {
      setCustomContacts(JSON.parse(saved));
    }
  }, []);

  // Save custom contacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("customEmergencyContacts", JSON.stringify(customContacts));
  }, [customContacts]);

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleAddContact = () => {
    if (customContacts.length >= 3) {
      alert("You can only add up to 3 custom emergency contacts.");
      return;
    }
    setEditingContact(null);
    setFormData({ name: "", relationship: "", phoneNumber: "" });
    setShowAddModal(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
    });
    setShowAddModal(true);
  };

  const handleDeleteContact = (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      setCustomContacts(customContacts.filter((c) => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phoneNumber) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingContact) {
      // Update existing contact
      setCustomContacts(
        customContacts.map((c) =>
          c.id === editingContact.id
            ? { ...editingContact, ...formData }
            : c
        )
      );
    } else {
      // Add new contact
      const newContact = {
        id: Date.now(),
        ...formData,
      };
      setCustomContacts([...customContacts, newContact]);
    }

    setShowAddModal(false);
    setFormData({ name: "", relationship: "", phoneNumber: "" });
    setEditingContact(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ name: "", relationship: "", phoneNumber: "" });
    setEditingContact(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>
        <button
          onClick={handleAddContact}
          disabled={customContacts.length >= 3}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          {t.addNew}
        </button>
      </div>

      {/* Custom Emergency Contacts */}
      {customContacts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">My Emergency Contacts ({customContacts.length}/3)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {customContacts.map((contact) => (
              <div
                key={contact.id}
                className="card p-5 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-primary-500/10 to-primary-700/10 border-primary-500/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{contact.name}</h4>
                      {contact.relationship && (
                        <p className="text-xs text-gray-400">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="p-1.5 hover:bg-dark-700 text-gray-400 hover:text-primary-500 rounded transition-colors"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-1.5 hover:bg-dark-700 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleCall(contact.phoneNumber)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {t.call} {contact.phoneNumber}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Custom Contacts Message */}
      {customContacts.length === 0 && (
        <div className="card p-8 text-center bg-dark-800/50 border-dashed">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">{t.noContacts}</p>
          <p className="text-sm text-gray-500 mb-4">{t.addFirst}</p>
        </div>
      )}

      {/* Default Emergency Services */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Emergency Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultEmergencyContacts.map((contact) => {
            const Icon = contact.icon;
            return (
              <div
                key={contact.id}
                className="card p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${contact.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {contact.description}
                    </p>
                    <button
                      onClick={() => handleCall(contact.number)}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-primary-600 text-white rounded-lg transition-colors font-semibold text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {contact.number}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="card p-6 bg-gradient-to-br from-primary-500/10 to-primary-700/10 border-primary-500/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Important Notice</h4>
            <p className="text-gray-300 text-sm">
              In case of a life-threatening emergency, always call 911 immediately.
              These contacts are provided for quick reference and non-emergency situations.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl p-6 max-w-md w-full border border-dark-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingContact ? "Edit Contact" : t.addNew}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.name} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter contact name"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.relationship}
                </label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="E.g., Mother, Father, Friend"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.phoneNumber} *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                  className="input-field"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {tCommon.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {editingContact ? tCommon.save : tCommon.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContacts;
