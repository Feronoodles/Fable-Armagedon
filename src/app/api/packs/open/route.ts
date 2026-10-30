import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackError } from "@/lib/packs";
import { openPlayerPack } from "@/lib/pack-transactions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const body: unknown = await req.json().catch(() => { throw new PackError("Solicitud inválida."); });
    if (!body || typeof body !== "object" || !("packId" in body) || typeof body.packId !== "string" || !body.packId.trim())
      throw new PackError("Indica el sobre que quieres abrir.");
    const packId = body.packId;
    const result = await prisma.$transaction(tx => openPlayerPack(tx, session.user.id, packId));
    return NextResponse.json({ message: "¡Sobre abierto exitosamente!", ...result });
  } catch (error) {
    if (error instanceof PackError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("Error abriendo sobre:", error);
    return NextResponse.json({ message: "No se pudo abrir el sobre. Se conservaron el sobre y las cartas." }, { status: 500 });
  }
}
