import { Coffee } from "lucide-react";

export default function PremiumUpgrade() {
  return (
    <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-white shadow-lg">
      <div className="flex items-center mb-2">
        <Coffee className="w-5 h-5 mr-2" />
        <h3 className="font-semibold">DevFlow Pro</h3>
      </div>
      <p className="text-sm text-green-100 mb-4">
        Unlock premium developer tools and features
      </p>
      <ul className="text-sm text-green-100 mb-4 space-y-1">
        <li>• Advanced analytics</li>
        <li>• Private repositories</li>
        <li>• Priority support</li>
      </ul>
      <button className="bg-white text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition-colors w-full">
        Upgrade Now
      </button>
    </div>
  );
}
