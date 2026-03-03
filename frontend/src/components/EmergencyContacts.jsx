import { Phone, Ambulance, Shield, Hospital, Users, AlertCircle } from "lucide-react";

const emergencyContacts = [
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
  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Emergency Contacts</h2>
        <p className="text-gray-400">Quick access to emergency services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencyContacts.map((contact) => {
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
    </div>
  );
};

export default EmergencyContacts;
