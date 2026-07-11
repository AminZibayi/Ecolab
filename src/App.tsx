import { useState, useEffect } from "react";
import { locales } from "./locales/fa";
import { Moon, Sun, Shield, Factory, Scales, ChartLine, Users, Info, HandPointing } from "@phosphor-icons/react";

import Applet1_PreferenceUtility from "./components/Applet1_PreferenceUtility";
import Applet2_ConsumerChoice from "./components/Applet2_ConsumerChoice";
import Applet3_ProductionCost from "./components/Applet3_ProductionCost";
import Applet4_EquilibriumElasticity from "./components/Applet4_EquilibriumElasticity";
import Applet5_GameTheory from "./components/Applet5_GameTheory";
import Applet6_Externality from "./components/Applet6_Externality";
import Applet7_LemonMarket from "./components/Applet7_LemonMarket";

type AppletKey = "PREFERENCE" | "CONSUMER" | "PRODUCTION" | "EQUILIBRIUM" | "GAME_THEORY" | "EXTERNALITY" | "LEMON_MARKET";

export default function App() {
  const [activeApplet, setActiveApplet] = useState<AppletKey>("PREFERENCE");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const applets = [
    {
      key: "PREFERENCE" as AppletKey,
      title: locales.applets.preferenceLab.title,
      description: locales.applets.preferenceLab.description,
      component: <Applet1_PreferenceUtility />,
      icon: <HandPointing size={18} className="text-blue-500" />,
    },
    {
      key: "CONSUMER" as AppletKey,
      title: locales.applets.consumerChoice.title,
      description: locales.applets.consumerChoice.description,
      component: <Applet2_ConsumerChoice />,
      icon: <Scales size={18} className="text-emerald-500" />,
    },
    {
      key: "PRODUCTION" as AppletKey,
      title: locales.applets.productionCost.title,
      description: locales.applets.productionCost.description,
      component: <Applet3_ProductionCost />,
      icon: <Factory size={18} className="text-amber-500" />,
    },
    {
      key: "EQUILIBRIUM" as AppletKey,
      title: locales.applets.equilibriumElasticity.title,
      description: locales.applets.equilibriumElasticity.description,
      component: <Applet4_EquilibriumElasticity />,
      icon: <ChartLine size={18} className="text-purple-500" />,
    },
    {
      key: "GAME_THEORY" as AppletKey,
      title: locales.applets.gameTheory.title,
      description: locales.applets.gameTheory.description,
      component: <Applet5_GameTheory />,
      icon: <Users size={18} className="text-sky-500" />,
    },
    {
      key: "EXTERNALITY" as AppletKey,
      title: locales.applets.externality.title,
      description: locales.applets.externality.description,
      component: <Applet6_Externality />,
      icon: <Shield size={18} className="text-rose-500" />,
    },
    {
      key: "LEMON_MARKET" as AppletKey,
      title: locales.applets.lemonMarket.title,
      description: locales.applets.lemonMarket.description,
      component: <Applet7_LemonMarket />,
      icon: <Info size={18} className="text-yellow-500" />,
    },
  ];

  const currentApplet = applets.find((app) => app.key === activeApplet)!;

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex flex-col text-right">
          <h1 className="text-lg md:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="bg-blue-600 w-2 h-6 rounded-full inline-block"></span>
            {locales.appName}
          </h1>
          <span className="text-[10px] md:text-xs text-zinc-500 font-medium mt-0.5">
            {locales.appSubtitle}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all active:scale-95"
            title={darkMode ? locales.theme.light : locales.theme.dark}
            type="button"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (Desktop) / Dropdown (Mobile) */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="md:hidden">
            {/* Mobile Dropdown selection */}
            <label className="text-xs font-bold text-zinc-500 block mb-1">انتخاب آزمایشگاه:</label>
            <div className="relative">
              <select
                value={activeApplet}
                onChange={(e) => setActiveApplet(e.target.value as AppletKey)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
              >
                {applets.map((app) => (
                  <option key={app.key} value={app.key}>
                    {app.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-1">
            <h2 className="text-xs font-bold text-zinc-500 px-3 mb-3">فهرست آزمایشگاه‌ها</h2>
            {applets.map((app) => {
              const isActive = app.key === activeApplet;
              return (
                <button
                  key={app.key}
                  onClick={() => setActiveApplet(app.key)}
                  className={`w-full text-right flex items-start gap-3 p-3 rounded-lg text-xs transition-all ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/20 border-r-4 border-blue-600 text-blue-700 dark:text-blue-400 font-bold"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
                  }`}
                  type="button"
                >
                  <span className="mt-0.5">{app.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-extrabold">{app.title}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-normal mt-0.5 leading-relaxed">
                      {app.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Selected Applet Canvas / Output area */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* Header of Active Applet */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex flex-col text-right">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {currentApplet.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">
                {currentApplet.description}
              </p>
            </div>
          </div>

          {/* Render Active Component */}
          <div className="transition-all duration-200">
            {currentApplet.component}
          </div>
        </main>

      </div>

      {/* Footer credits */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-8 text-center text-xs text-zinc-500 dark:text-zinc-500 font-medium mt-auto">
        {locales.credits}
      </footer>
    </div>
  );
}
