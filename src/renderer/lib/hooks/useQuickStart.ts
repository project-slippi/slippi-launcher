import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useSettings } from "@/lib/hooks/useSettings";

import { useAccount } from "./useAccount";

export enum QuickStartStep {
  LOGIN = "LOGIN",
  MIGRATE_DOLPHIN = "MIGRATE_DOLPHIN",
  ACTIVATE_ONLINE = "ACTIVATE_ONLINE",
  SET_ISO_PATH = "SET_ISO_PATH",
  COMPLETE = "COMPLETE",
}

function generateSteps(
  options: Partial<{
    hasUser: boolean;
    hasPlayKey: boolean;
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

  if (!options.hasPlayKey) {
    steps.unshift(QuickStartStep.ACTIVATE_ONLINE);
  }

  if (!options.hasUser) {
    steps.unshift(QuickStartStep.LOGIN);
  }

  return steps;
}

export const useQuickStart = () => {
  const history = useHistory();
  const savedIsoPath = useSettings((store) => store.settings.isoPath);
  const user = useAccount((store) => store.user);
  const playKey = useAccount((store) => store.playKey);
  const desktopAppPathExists = useDesktopApp((store) => store.exists);
  const options = {
    hasUser: Boolean(user),
    hasIso: Boolean(savedIsoPath),
    hasPlayKey: Boolean(playKey),
    hasOldDesktopApp: desktopAppPathExists,
  };
  const [steps] = React.useState(generateSteps(options));
  const [currentStep, setCurrentStep] = React.useState<QuickStartStep | null>(null);

  React.useEffect(() => {
    // If we only have the complete step then just go to the main page
    if (steps.length === 1 && steps[0] === QuickStartStep.COMPLETE) {
      history.push("/main");
      return;
    }

    let stepToShow: QuickStartStep | null = QuickStartStep.COMPLETE;
    if (!options.hasIso) {
      stepToShow = QuickStartStep.SET_ISO_PATH;
    }

    if (options.hasOldDesktopApp) {
      stepToShow = QuickStartStep.MIGRATE_DOLPHIN;
    }

    if (!options.hasPlayKey) {
      stepToShow = QuickStartStep.ACTIVATE_ONLINE;
    }

    if (!options.hasUser) {
      stepToShow = QuickStartStep.LOGIN;
    }
    setCurrentStep(stepToShow);
  }, [history, steps, options.hasIso, options.hasOldDesktopApp, options.hasPlayKey, options.hasUser]);

  const nextStep = useCallback(() => {
    const currentIndex = steps.findIndex((s) => s === currentStep);
    if (currentIndex !== -1 && currentIndex + 1 < steps.length) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, steps]);

  const prevStep = useCallback(() => {
    const currentIndex = steps.findIndex((s) => s === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep, steps]);

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
