import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/menu");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-6">
          Fable Armageddon
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          El mejor juego de cartas estratégico
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-lg transition-all duration-200 border border-gray-600"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}