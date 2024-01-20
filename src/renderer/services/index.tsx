import { Preconditions } from "@common/preconditions";
import React, { createContext, useContext } from "react";

import type { Services } from "./types";

const ServiceContext = createContext<Services | null>(null);

export const useServices = (): Services => {
  const services = useContext(ServiceContext);
  Preconditions.checkExists(services, "You must wrap your component in ServiceProvider to use services!");
  return services;
};

export function createServiceProvider({ services }: { services: Services }) {
  const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
    return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
  };
  return { ServiceProvider };
}
