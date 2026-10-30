import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { CommandGate } from "@/components/command/CommandGate";
import { CommandIcon } from "@/components/command/CommandIcon";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/menu");
  return <CommandGate link="/login" label="Ya tengo una cuenta"><section className="command-landing"><p className="command-eyebrow">ESTRATEGIA · CARTAS · CONQUISTA</p><h1>Fable<br />Armageddon.</h1><p>Reúne criaturas de eras perdidas y máquinas de un futuro roto. Construye tu mazo, domina los elementos y escribe tu propia crónica en el campo de batalla.</p><div className="command-gate-actions"><Link className="command-button" href="/register">Comenzar mi crónica<CommandIcon name="arrow" /></Link><Link className="command-text-link" href="/login">Iniciar sesión</Link></div></section></CommandGate>;
}
