import React, { createContext, useContext } from "react";

import type { Services } from "./types";

const ServiceContext = createContext<Services | null>(null);

export const useServices = () => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error("You must wrap your component in ServiceProvider to use services!");
  }
  return services;
};

export function createServiceProvider({ services }: { services: Services }) {
  const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
    return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
  };
  return { ServiceProvider };
}
