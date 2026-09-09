"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/shared/nav-bar";
import { useAppStore } from "@/lib/store";

function subscribeHydration(callback: () => void) {
  return useAppStore.persist.onFinishHydration(callback);
}

function getHydrated() {
  return useAppStore.persist.hasHydrated();
}

function getServerHydrated() {
  return false;
}

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete, router]);

  if (!hydrated || !onboardingComplete) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
