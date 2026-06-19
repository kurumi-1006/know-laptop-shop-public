"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseSupabaseRealtimeOptions {
  channelName: string;
  table: string;
  event: RealtimeEvent;
  filter?: string;
  callback: () => void;
}

export function useSupabaseRealtime({
  channelName,
  table,
  event,
  filter,
  callback,
}: UseSupabaseRealtimeOptions) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const subscribedRef = useRef(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = client.channel(channelName);

    const subscription = {
      event,
      schema: "public",
      table,
      filter,
    };

    channel
      .on("postgres_changes" as never, subscription as never, () => {
        callbackRef.current();
      })
      .subscribe();

    return () => {
      subscribedRef.current = false;
      client.removeChannel(channel);
    };
  }, [channelName, table, event, filter]);
}
