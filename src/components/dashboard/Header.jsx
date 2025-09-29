import { Bell, Search, Menu, User } from "./icons";
import useUser from "@/utils/useUser";

const sectionTitles = {
  training: "Training Dashboard",
  analytics: "Analytics Center",
  "live-play": "Live Play Interface",
  models: "Model Management",
  system: "System Monitor",
  "neural-forge": "Neural Network + Forge Integration",
};

export default function Header({ activeSection, setIsMobileMenuOpen }) {
  const { data: user } = useUser();
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-barlow text-2xl font-semibold text-black dark:text-white">
            {sectionTitles[activeSection] || "ManaMind"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-3xl px-4 py-2">
            <Search size={20} className="text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search training sessions, models..."
              className="bg-transparent border-none outline-none text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-60"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors status-indicator status-running">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <span className="font-barlow text-sm font-medium text-black dark:text-white">
                  {user?.email || "Guest"}
                </span>
                {user ? (
                  <a
                    href="/account/logout"
                    className="text-xs text-[#357AFF] hover:text-[#2E69DE]"
                  >
                    Logout
                  </a>
                ) : (
                  <a
                    href="/account/signin"
                    className="text-xs text-[#357AFF] hover:text-[#2E69DE]"
                  >
                    Sign in
                  </a>
                )}
                {user && (
                  <a
                    href="/admin/roles"
                    className="text-xs text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  >
                    Roles
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
