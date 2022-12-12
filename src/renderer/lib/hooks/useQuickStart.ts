import { currentRulesVersion } from "@common/constants";
import React from "react";
import { useNavigate } from "react-router-dom";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useSettings } from "@/lib/hooks/useSettings";

import { useAccount } from "./useAccount";

export enum QuickStartStep {
  LOGIN = "LOGIN",
  VERIFY_EMAIL = "VERIFY_EMAIL",
  ACCEPT_RULES = "ACCEPT_RULES",
  MIGRATE_DOLPHIN = "MIGRATE_DOLPHIN",
  ACTIVATE_ONLINE = "ACTIVATE_ONLINE",
  SET_ISO_PATH = "SET_ISO_PATH",
  COMPLETE = "COMPLETE",
}

function generateSteps(
  options: Partial<{
    hasUser: boolean;
    hasPlayKey: boolean;
    hasVerifiedEmail: boolean;
    showRules: boolean;
    serverError: boolean;
    hasIso: boolean;
    hasOldDesktopApp: boolean;
  }>,
): QuickStartStep[] {
  // Build the steps in reverse order
  const steps: QuickStartStep[] = [QuickStartStep.COMPLETE];

  if (!options.hasIso) {
    steps.unshift(QuickStartStep.SET_ISO_PATH);
  }

  if (options.hasOldDesktopApp) {
    steps.unshift(QuickStartStep.MIGRATE_DOLPHIN);
  }

  if (!options.hasPlayKey && !options.serverError) {
    steps.unshift(QuickStartStep.ACTIVATE_ONLINE);
  }

  if (options.showRules && !options.serverError) {
    steps.unshift(QuickStartStep.ACCEPT_RULES);
  }

  if (!options.hasVerifiedEmail && !options.serverError) {
    steps.unshift(QuickStartStep.VERIFY_EMAIL);
  }

  if (!options.hasUser) {
    steps.unshift(QuickStartStep.LOGIN);
  }

  return steps;
}

export const useQuickStart = () => {
  const navigate = useNavigate();
  const savedIsoPath = useSettings((store) => store.settings.isoPath);
  const user = useAccount((store) => store.user);
  const userData = useAccount((store) => store.userData);
  const serverError = useAccount((store) => store.serverError);
  const desktopAppPathExists = useDesktopApp((store) => store.exists);
  const options = {
    hasUser: Boolean(user),
    hasIso: Boolean(savedIsoPath),
    hasVerifiedEmail: Boolean(user?.emailVerified),
    hasPlayKey: Boolean(userData?.playKey),
    showRules: Boolean((userData?.rulesAccepted ?? 0) < currentRulesVersion),
    serverError: Boolean(serverError),
    hasOldDesktopApp: desktopAppPathExists,
  };
  const [steps] = React.useState(generateSteps(options));
  const [currentStep, setCurrentStep] = React.useState<QuickStartStep | null>(null);

  React.useEffect(() => {
    // If we only have the complete step then just go to the main page
    if (steps.length === 1 && steps[0] === QuickStartStep.COMPLETE) {
      navigate("/main");
      return;
    }

    let stepToShow: QuickStartStep | null = QuickStartStep.COMPLETE;
    if (!options.hasIso) {
      stepToShow = QuickStartStep.SET_ISO_PATH;
    }

    if (options.hasOldDesktopApp) {
      stepToShow = QuickStartStep.MIGRATE_DOLPHIN;
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
    steps,
    options.hasIso,
    options.hasVerifiedEmail,
    options.hasOldDesktopApp,
    options.hasPlayKey,
    options.hasUser,
    options.showRules,
    options.serverError,
    navigate,
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
    allSteps: steps,
    currentStep,
    nextStep,
    prevStep,
  };
};

export const oldDesktopApp = { path: "", exists: false };

export const useDesktopApp = create(
  combine(
    {
      exists: false,
      dolphinPath: "",
    },
    (set) => ({
      setExists: (exists: boolean) => set({ exists }),
      setDolphinPath: (dolphinPath: string) => set({ dolphinPath }),
    }),
  ),
);
