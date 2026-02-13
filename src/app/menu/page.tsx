"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSelector from "@/components/LanguageSelector";

export default function MenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-2xl">{t("common.loading")}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const menuOptions = [
    {
      title: t("menu.play"),
      description: t("menu.playDesc"),
      icon: "⚔️",
      color: "from-red-500 to-orange-500",
      onClick: () => alert(t("menu.play")),
    },
    {
      title: t("menu.collection"),
      description: t("menu.collectionDesc"),
      icon: "🎴",
      color: "from-blue-500 to-cyan-500",
      onClick: () => router.push("/collection"),
    },
    {
      title: t("menu.packs"),
      description: t("menu.packsDesc"),
      icon: "📦",
      color: "from-yellow-500 to-amber-500",
      onClick: () => router.push("/packs"),
    },
    {
      title: t("menu.profile"),
      description: t("menu.profileDesc"),
      icon: "👤",
      color: "from-green-500 to-emerald-500",
      onClick: () => alert(t("menu.profile")),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
              {t("common.appName")}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="text-right">
              <p className="text-white font-medium">{session.user.name || session.user.email}</p>
              <p className="text-gray-400 text-sm">{t("menu.level", { level: 1 })}</p>
            </div>
            <div className="flex items-center space-x-2 text-yellow-400">
              <span>🪙</span>
              <span className="font-bold">1000</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-400">
              <span>💎</span>
              <span className="font-bold">100</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            {t("menu.welcome", { name: session.user.name || (t("menu.play") === "Play" ? "Duelist" : "Duelista") })}
          </h2>
          <p className="text-xl text-gray-300">
            {t("menu.whatToDo")}
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {menuOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.onClick}
              className={`group relative p-8 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
              <div className="relative z-10 flex items-center space-x-4">
                <span className="text-5xl">{option.icon}</span>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold bg-gradient-to-r ${option.color} bg-clip-text text-transparent`}>
                    {option.title}
                  </h3>
                  <p className="text-gray-400 mt-1">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* News Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6">{t("menu.news")}</h3>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 pb-4 border-b border-gray-700">
                <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                  {t("menu.new")}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{t("menu.cardsImplemented")}</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("menu.cardsDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4 pb-4 border-b border-gray-700">
                <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                  {t("menu.update")}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{t("menu.elementsAvailable")}</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("menu.elementsDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                  {t("menu.comingSoon")}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{t("menu.battleMode")}</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("menu.battleDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}