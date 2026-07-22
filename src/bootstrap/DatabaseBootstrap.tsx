import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { db } from "@/data/db/client";
import { seedDatabase } from "@/data/db/seeds/seedDatabase";

import { AppLoadingScreen } from "./AppLoadingScreen";
import { AppStartupError } from "./AppStartupError";

import migrations from "../data/db/migrations/migrations";

type StartupState =
  | { status: "migrating" }
  | { status: "seeding" }
  | { status: "ready" }
  | {
      status: "error";
      phase: "migration" | "seed";
      error: Error;
    };

interface DatabaseBootstrapProps {
  onRetry: () => void;
  children: ReactNode;
}

export function DatabaseBootstrap({
  onRetry,
  children,
}: DatabaseBootstrapProps) {
  const { success: migrationsReady, error: migrationError } = useMigrations(
    db,
    migrations,
  );

  const [startupState, setStartupState] = useState<StartupState>({
    status: "migrating",
  });

  const seedingStartedRef = useRef(false);

  // Handle migration failure.
  useEffect(() => {
    if (!migrationError) {
      return;
    }

    setStartupState({
      status: "error",
      phase: "migration",
      error: migrationError,
    });
  }, [migrationError]);

  // Seed only after migrations have completed.
  useEffect(() => {
    if (!migrationsReady || seedingStartedRef.current) {
      return;
    }

    seedingStartedRef.current = true;

    setStartupState({
      status: "seeding",
    });

    seedDatabase()
      .then(() => {
        setStartupState({
          status: "ready",
        });
      })
      .catch((error: Error) => {
        setStartupState({
          status: "error",
          phase: "seed",
          error: error,
        });
      });
  }, [migrationsReady]);

  switch (startupState.status) {
    case "migrating":
    case "seeding":
      return <AppLoadingScreen />;

    case "error":
      console.error(
        `Database ${startupState.phase} failed:`,
        startupState.error,
      );

      return <AppStartupError onRetry={onRetry} error={startupState.error} />;

    case "ready":
      return <>{children}</>;
  }
}
