import {
  Brain,
  BarChart3,
  Eye,
  Database,
  Monitor,
  Settings,
  X,
  Hammer,
  Gamepad2, // added
} from "./icons";

const navItems = [
  { icon: Brain, label: "Training", key: "training", active: true },
  { icon: BarChart3, label: "Analytics", key: "analytics" },
  { icon: Eye, label: "Live Play", key: "live-play" },
  { icon: Gamepad2, label: "Arena", key: "mtga" }, // added
  { icon: Database, label: "Models", key: "models" },
  { icon: Hammer, label: "Forge", key: "forge" },
  { icon: Monitor, label: "System", key: "system" },
];

const NavLink = ({ icon: Icon, label, active, onClick }) => (
  <div
    className={`flex items-center gap-4 cursor-pointer ${
      active
        ? "text-[#0054B5] dark:text-blue-400 relative"
        : "text-black dark:text-gray-300 nav-transition hover:text-[#0054B5] dark:hover:text-blue-400"
    }`}
    onClick={onClick}
  >
    {active && (
      <div className="absolute -left-6 w-1 h-8 gradient-royal-indigo rounded-r-3xl"></div>
    )}
    <Icon size={24} />
    <span className="font-barlow text-base font-medium">{label}</span>
  </div>
);

const Logo = () => (
  <div className="flex items-center gap-3 mb-12">
    <div className="w-8 h-8 gradient-neural-purple rounded-3xl flex items-center justify-center">
      <Brain size={20} className="text-white" />
    </div>
    <span className="font-barlow text-xl font-semibold text-black dark:text-white">
      ManaMind
    </span>
  </div>
);

export default function Sidebar({
  activeSection,
  setActiveSection,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:flex lg:flex-col min-h-screen
      `}
      >
        <div className="lg:hidden flex justify-end px-6 pt-6">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="px-6 pt-6 lg:pt-12 flex-1 flex flex-col">
          <Logo />
          <nav className="space-y-6 flex-1">
            {navItems.map((item) => {
              // Avoid spreading a `key` prop into NavLink to silence React warning
              const { key: itemKey, ...rest } = item;
              const isActive = activeSection === itemKey;
              const handleClick = () => {
                setActiveSection(itemKey);
                setIsMobileMenuOpen(false);
              };
              return (
                <NavLink
                  key={itemKey}
                  {...rest}
                  active={isActive}
                  onClick={handleClick}
                />
              );
            })}
          </nav>

          <div className="mt-auto pb-12 space-y-3">
            {/* Existing Settings → Roles link */}
            <a
              href="/admin/roles"
              className="flex items-center gap-4 text-black dark:text-gray-300 nav-transition hover:text-[#0054B5] dark:hover:text-blue-400 cursor-pointer"
            >
              <Settings size={24} />
              <span className="font-barlow text-base font-medium">
                Settings: Roles
              </span>
            </a>
            {/* New Environment link under Settings */}
            <a
              href="/admin/settings/env"
              className="flex items-center gap-4 text-black dark:text-gray-300 nav-transition hover:text-[#0054B5] dark:hover:text-blue-400 cursor-pointer"
            >
              <Settings size={24} />
              <span className="font-barlow text-base font-medium">
                Settings: Environment
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
