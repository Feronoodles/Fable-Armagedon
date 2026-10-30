import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackError, parsePackPurchase } from "@/lib/packs";
import { purchasePacks } from "@/lib/pack-transactions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const body: unknown = await req.json().catch(() => { throw new PackError("La compra no es válida."); });
    const purchase = parsePackPurchase(body);
    const result = await prisma.$transaction(tx => purchasePacks(tx, session.user.id, purchase));
    return NextResponse.json({ message: purchase.quantity === 1 ? "Sobre comprado correctamente." : "Sobres comprados correctamente.", ...result });
  } catch (error) {
    if (error instanceof PackError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("Error comprando sobres:", error);
    return NextResponse.json({ message: "Error al comprar sobres. La compra no se completó." }, { status: 500 });
  }
}
