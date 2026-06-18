import { runNewsHarvest } from "../src/lib/news-harvester/worker";

runNewsHarvest()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
