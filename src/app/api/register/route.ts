import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseRegistration, RegistrationValidationError } from "@/lib/registration-validation";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => { throw new RegistrationValidationError("BODY"); });
    const { username, email, password } = parseRegistration(body);

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    const existingUsername = await prisma.player.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { message: "El nombre de usuario ya está en uso" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Buscar el tipo de sobre de bienvenida
    const welcomePack = await prisma.packType.findFirst({
      where: { name: "Sobre de Bienvenida" },
    });

    if (!welcomePack) {
      return NextResponse.json(
        { message: "Error: No se encontró el sobre de bienvenida" },
        { status: 500 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: username,
        player: {
          create: {
            username,
            packs: {
              create: [
                { packTypeId: welcomePack.id, quantity: 1 },
                { packTypeId: welcomePack.id, quantity: 1 },
                { packTypeId: welcomePack.id, quantity: 1 },
              ],
            },
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Usuario creado exitosamente", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RegistrationValidationError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("Error en registro:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { message: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
