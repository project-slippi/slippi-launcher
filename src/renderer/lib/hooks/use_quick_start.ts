import { currentRulesVersion } from "@common/constants";
import React from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useSettings, useSettingsStore } from "@/lib/hooks/use_settings";
import type { AuthUser } from "@/services/auth/types";
import type { UserData } from "@/services/slippi/types";

import { useAccount } from "./use_account";

export enum QuickStartStep {
  LOGIN = "LOGIN",
  VERIFY_EMAIL = "VERIFY_EMAIL",
  ACCEPT_RULES = "ACCEPT_RULES",
  ACTIVATE_ONLINE = "ACTIVATE_ONLINE",
  SET_ISO_PATH = "SET_ISO_PATH",
  COMPLETE = "COMPLETE",
}

export const useQuickStartStore = create(
  combine(
    {
      steps: [] as QuickStartStep[],
    },
    (set) => ({
      setSteps: (steps: QuickStartStep[]) => set({ steps }),
    }),
  ),
);

const useQuickStartOptions = () => {
  const savedIsoPath = useSettings((store) => store.settings.isoPath);
  const user = useAccount((store) => store.user);
  const userData = useAccount((store) => store.userData);
  const serverError = useAccount((store) => store.serverError);
  return React.useMemo(() => {
    return {
      hasUser: Boolean(user),
      hasIso: Boolean(savedIsoPath),
      hasVerifiedEmail: Boolean(user?.emailVerified),
      hasPlayKey: Boolean(userData?.playKey),
      showRules: Boolean((userData?.rulesAccepted ?? 0) < currentRulesVersion),
      serverError: Boolean(serverError),
    };
  }, [user, userData, serverError, savedIsoPath]);
};

export const useQuickStart = () => {
  const options = useQuickStartOptions();
  const [currentStep, setCurrentStep] = React.useState<QuickStartStep | null>(null);
  const steps = useQuickStartStore((store) => store.steps);

  React.useEffect(() => {
    let stepToShow: QuickStartStep | null = QuickStartStep.COMPLETE;
    if (!options.hasIso) {
      stepToShow = QuickStartStep.SET_ISO_PATH;
    }

    if (!options.hasPlayKey && !options.serverError) {
      stepToShow = QuickStartStep.ACTIVATE_ONLINE;
    }

    if (options.showRules && !options.serverError) {
      stepToShow = QuickStartStep.ACCEPT_RULES;
    }

    if (!options.hasVerifiedEmail && !options.serverError) {
      stepToShow = QuickStartStep.VERIFY_EMAIL;
    }

    if (!options.hasUser) {
      stepToShow = QuickStartStep.LOGIN;
    }

    setCurrentStep(stepToShow);
  }, [
    options.hasIso,
    options.hasVerifiedEmail,
    options.hasPlayKey,
    options.hasUser,
    options.showRules,
    options.serverError,
  ]);

  const nextStep = () => {
    const currentIndex = steps.findIndex((s) => s === currentStep);
    if (currentIndex !== -1 && currentIndex + 1 < steps.length) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((s) => s === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return {
    currentStep,
    nextStep,
    prevStep,
  };
};

/**
 * Generates the quick start steps, and sets them in the store. This is called only once on app initialization.
 */
export function generateQuickStartSteps(state: {
  user: AuthUser | null;
  userData: UserData | null;
  serverError: boolean;
}): void {
  const { user, userData, serverError } = state;

  // Build the steps
  const steps: QuickStartStep[] = [];

  if (user == null) {
    steps.push(QuickStartStep.LOGIN);
  }

  const hasVerifiedEmail = Boolean(user?.emailVerified);
  if (!hasVerifiedEmail && !serverError) {
    steps.push(QuickStartStep.VERIFY_EMAIL);
  }

  const showRules = Boolean((userData?.rulesAccepted ?? 0) < currentRulesVersion);
  if (showRules && !serverError) {
    steps.push(QuickStartStep.ACCEPT_RULES);
  }

  const hasPlayKey = Boolean(userData?.playKey);
  if (!hasPlayKey && !serverError) {
    steps.push(QuickStartStep.ACTIVATE_ONLINE);
  }

  const hasIso = Boolean(useSettingsStore.getState().settings.isoPath);
  if (!hasIso) {
    steps.push(QuickStartStep.SET_ISO_PATH);
  }

  // Always finish with the complete step if we have any steps
  if (steps.length > 0) {
    steps.push(QuickStartStep.COMPLETE);
  }

  useQuickStartStore.getState().setSteps(steps);
}
