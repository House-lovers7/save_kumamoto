import { fileURLToPath } from "node:url";

const notImplemented = () => {
  throw new Error("patrol diff not implemented");
};

export const normalizeText = notImplemented;
export const buildPatrolPlan = notImplemented;
export const checkCardContent = notImplemented;
export const runPatrol = notImplemented;
export const renderReport = notImplemented;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  notImplemented();
}
