import { JobDataMap } from "@/types/worker";
import { Queue } from "bullmq";

export const jobQueue = new Queue<JobDataMap>("jobQueue", {
  connection: {
    url: process.env.BULLMQ_REDIS_URL,
  },
});
