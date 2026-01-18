import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export default {
  project: process.env.TRIGGER_PROJECT_ID || "your-project-id",
  logLevel: "info",
  maxDuration: 300_000,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
} satisfies TriggerConfig;
