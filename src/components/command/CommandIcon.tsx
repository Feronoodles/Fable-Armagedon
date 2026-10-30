import type { SVGProps } from "react";

export type CommandIconName = "citadel" | "swords" | "decks" | "collection" | "packs" | "profile" | "gold" | "gems" | "arrow" | "plus" | "search" | "close" | "more";
const paths: Record<CommandIconName, string> = {
  citadel: "M4 21V9h4V4l4-3 4 3v5h4v12M2 21h20M9 21v-6h6v6M10 7h4M5 12h2m10 0h2",
  swords: "m3 3 8 2 9 14-1 1L5 11 3 3Zm18 0-8 2M3 21l5-5m8-8 5-5M2 17l5 5m10-20 5 5",
  decks: "M7 5V2h14v17h-3M3 6h14v16H3V6Zm4 4h6m-6 4h6m-6 4h3",
  collection: "M2 4h8l2 2 2-2h8v17h-8l-2 2-2-2H2V4Zm10 2v17M5 8h4m6 0h4M5 12h4m6 0h4M5 16h4m6 0h4",
  packs: "M4 3h16v18H4V3Zm0 4h16M4 17h16m-8-8 4 3-4 3-4-3 4-3Z",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-4a8 8 0 0 1 16 0v4H4Z",
  gold: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v12m3-9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9",
  gems: "m7 3-5 6 10 13L22 9l-5-6H7ZM2 9h20M7 3l5 19 5-19",
  arrow: "M3 12h17m-6-6 6 6-6 6",
  plus: "M12 4v16M4 12h16", search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6",
  close: "m5 5 14 14M5 19 19 5", more: "M4 12h1m6 0h1m6 0h1",
};
export function CommandIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: CommandIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
