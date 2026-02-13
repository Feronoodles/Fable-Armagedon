import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
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
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}