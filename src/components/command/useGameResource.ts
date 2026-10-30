"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** Authenticated, cancellable reads shared by the command screens. */
export function useGameResource<T>(path: string) {
  const { status, data: session } = useSession();
  const ownerId = session?.user?.id;
  const [resource, setResource] = useState<{ ownerId: string; value: T } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (status !== "authenticated" || !ownerId) return;
    const currentOwner = ownerId;
    const controller = new AbortController();
    async function read() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(path, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "No se pudo cargar la información.");
        if (!controller.signal.aborted) setResource({ ownerId: currentOwner, value: result });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Error de conexión.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void read();
    return () => controller.abort();
  }, [path, status, ownerId, revision]);
  const data = status === "authenticated" && resource && resource.ownerId === ownerId ? resource.value : null;
  return { data, error, loading, reload };
}

export async function gameMutation<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "No se pudo completar la acción.");
  return result as T;
}
