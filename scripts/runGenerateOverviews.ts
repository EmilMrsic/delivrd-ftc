import { generateOverviews } from "@/lib/helpers/overview";

export const main = async () => {
  const overviews = await generateOverviews();
};

main().then(() => {
  process.exit(0);
});
