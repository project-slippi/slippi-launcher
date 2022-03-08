import { createContext, useContext } from "react";

import type { Services } from "./types";

const ServiceContext = createContext<Services>(null as unknown as Services);

export const ServiceProvider = ServiceContext.Provider;

export const useServices = () => useContext(ServiceContext);
