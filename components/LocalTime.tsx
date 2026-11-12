"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/site.config";

// Live local clock for the footer. Renders nothing on the server, then hydrates
// on mount — avoids an SSR/CSR mismatch since the time isn't known at build.
// Timezone + label come from site.config.ts. Leading separator so it tucks onto
// the end of the footer line only once it's present.
export default function LocalTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: siteConfig.timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
        .format(new Date())
        .toLowerCase();
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return <> &middot; {time} in {siteConfig.timezoneLabel}</>;
}
