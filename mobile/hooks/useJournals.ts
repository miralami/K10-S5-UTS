import { useState, useCallback } from "react";
import { JournalNote } from "../types";
import * as journalService from "../services/journal";

export function useJournals() {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await journalService.list();
      setNotes(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load journals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  const deleteNote = useCallback(async (id: number) => {
    await journalService.remove(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, isLoading, error, fetch, refresh, deleteNote };
}
