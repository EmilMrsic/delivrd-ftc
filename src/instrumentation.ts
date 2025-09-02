export async function register() {
  console.log("loaded instrumentation");

  process.on("uncaughtException", (err) => {
    console.error("caught error:", err);
  });

  process.on("unhandledRejection", (reason: any) => {
    console.error("Unhandled promise rejection:", reason);
  });
}
