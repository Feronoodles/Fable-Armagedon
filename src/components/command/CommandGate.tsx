import Link from "next/link";
import { CommandIcon } from "./CommandIcon";

export function CommandGate({ children, link = "/", label = "Volver al inicio" }: { children: React.ReactNode; link?: string; label?: string }) {
  return <main className="command-gate"><header className="command-gate-header"><Link href="/" className="command-brand"><CommandIcon name="citadel" /><span>FABLE<small>ARMAGEDDON</small></span></Link><Link href={link}>{label} ↗</Link></header><div className="command-gate-content">{children}</div><footer className="command-gate-foot">FABLE ARMAGEDDON · FORJA TU LEGADO</footer></main>;
}
