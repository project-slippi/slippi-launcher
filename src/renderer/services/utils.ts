/* eslint-disable @typescript-eslint/ban-types */
import { delay } from "@common/delay";

export const delayAndMaybeError =
  (shouldError?: boolean) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const source = `${target.constructor.name}.${propertyKey}`;
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await delay(1000);
      if (shouldError) {
        throw new Error(`${source} threw a mock error.`);
      }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
