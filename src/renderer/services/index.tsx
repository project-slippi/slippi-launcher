import React, { createContext, useContext } from "react";

import { LoadingScreen } from "@/components/LoadingScreen";

import { installServices } from "./install";
import type { Services } from "./types";

const ServiceContext = createContext<Services | null>(null);

export const useServices = () => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error("You must wrap your component in ServiceProvider to use services!");
  }
  return services;
};

const LazyServiceProvider = React.lazy(async () => {
  const services = await installServices();
  const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
    return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
  };
  return { default: ServiceProvider };
});

export const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <LazyServiceProvider>{children}</LazyServiceProvider>
    </React.Suspense>
  );
};
