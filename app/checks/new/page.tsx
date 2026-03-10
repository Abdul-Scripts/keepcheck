"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyNewCheckRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/new-check/");
  }, [router]);

  return null;
}

