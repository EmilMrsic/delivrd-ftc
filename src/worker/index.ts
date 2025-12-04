import { JobDataMap } from "@/types/worker";
import { Worker } from "bullmq";

const worker = new Worker<JobDataMap>(
  "jobWorker",
  async (job) => {
    console.log("haha trying to run a job!", job);
  },
  {
    connection: { url: process.env.BULLMQ_REDIS_URL },
    concurrency: 1,
  }
);
