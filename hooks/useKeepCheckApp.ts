"use client";

import { useEffect, useState } from "react";
import { CheckRecord } from "@/types/check";
import { UserProfile } from "@/types/profile";
import {
  APP_BOOTSTRAP_STORAGE_KEY,
  APP_BOOTSTRAP_VERSION,
  CHECKS_STORAGE_KEY,
  detectStandaloneMode,
  isBootstrapCurrent,
  loadChecks,
  loadProfile,
  markBootstrapComplete as persistBootstrapComplete,
  PROFILE_STORAGE_KEY,
} from "@/lib/keepcheck";

let hydratedClient = false;
let checksCache: CheckRecord[] | null = null;
let profileCache: UserProfile | null | undefined;

export function useKeepCheckApp() {
  const [isReady, setIsReady] = useState(() => hydratedClient);
  const [isStandalone, setIsStandalone] = useState(() =>
    hydratedClient ? detectStandaloneMode() : false
  );
  const [checks, setChecks] = useState<CheckRecord[]>(() => {
    if (checksCache) return checksCache;
    return loadChecks();
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (profileCache !== undefined) return profileCache;
    return loadProfile();
  });
  const [bootstrapComplete, setBootstrapComplete] = useState(() =>
    hydratedClient ? isBootstrapCurrent() : false
  );

  useEffect(() => {
    const standalone = detectStandaloneMode();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone);

    if (!hydratedClient) {
      hydratedClient = true;
      setIsReady(true);

      const loadedChecks = checksCache ?? loadChecks();
      const loadedProfile =
        profileCache !== undefined ? profileCache : loadProfile();

      checksCache = loadedChecks;
      profileCache = loadedProfile;
      setChecks(loadedChecks);
      setProfile(loadedProfile);
      setBootstrapComplete(isBootstrapCurrent());
      return;
    }

    if (!isReady) {
      setIsReady(true);
    }
  }, [isReady]);

  useEffect(() => {
    checksCache = checks;
    if (!isReady) return;
    localStorage.setItem(CHECKS_STORAGE_KEY, JSON.stringify(checks));
  }, [checks, isReady]);

  useEffect(() => {
    profileCache = profile;
    if (!isReady) return;
    if (!profile) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile, isReady]);

  useEffect(() => {
    if (!isReady) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBgColor = html.style.backgroundColor;
    const prevBodyBgColor = body.style.backgroundColor;

    if (!isStandalone || !profile) {
      html.style.backgroundColor = "#DBEAFE";
      body.style.backgroundColor = "#DBEAFE";
    } else {
      html.style.backgroundColor = "#0F172A";
      body.style.backgroundColor = "#0F172A";
    }

    return () => {
      html.style.backgroundColor = prevHtmlBgColor;
      body.style.backgroundColor = prevBodyBgColor;
    };
  }, [isReady, isStandalone, profile]);

  return {
    isReady,
    isStandalone,
    bootstrapComplete,
    checks,
    setChecks,
    profile,
    setProfile,
    markBootstrapComplete: () => {
      persistBootstrapComplete();
      setBootstrapComplete(true);
    },
    resetBootstrapComplete: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(APP_BOOTSTRAP_STORAGE_KEY);
      }
      setBootstrapComplete(false);
    },
    bootstrapVersion: APP_BOOTSTRAP_VERSION,
  };
}
