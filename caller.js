require("dotenv").config();
const cron = require("node-cron");
const { getAuroraStrategies, harvestStrategies } = require("./schedules/auroraHarvesting/auroraHarvester");
const {
  loadBeefyFeeRecipients,
  harvestAll,
} = require("./schedules/feeBatchHarvesting/feeRecipients");

const main = async () => {
  await loadBeefyFeeRecipients();

  console.log("EPETE")
  console.log("IS THE BEST")

  cron.schedule("0 0 0,6,12,18 * * *", async () => {
    console.log("updating FeeRecipients");
    try {
      await loadBeefyFeeRecipients();
    } catch (error) {
      console.log('error harvesting feebatches all');
    }
    console.log("feeRecipients updated");
  }, { timezone: "America/Buenos_Aires" });

  cron.schedule("0 0 10,22 * * *", async () => {
    console.log("harvesting feeRecipients");
    try {
      await harvestAll();
    } catch (error) {
      console.log('error harvesting feebatches all');
    }
    console.log("feeRecipients harvested");
  }, { timezone: "America/Buenos_Aires" });

  await getAuroraStrategies();
  cron.schedule("0 */4 * * * *", async () => {

    try {
      console.log('aurora harvesting')
      await harvestStrategies();
      console.log('finished harvesting aurora')
    } catch (error) {
      console.log("error harvesting aurora")
    }
    console.log("harvestingAurora")
  }, { timezone: "America/Buenos_Aires" });


  cron.schedule("0 0 */6 * * *", async () => {

    try {
      console.log('Updating aurora strategies')
      await getAuroraStrategies();
      console.log('finished updating strategies aurora')
    } catch (error) {
      console.log("error harvesting aurora")
    }
  }, { timezone: "America/Buenos_Aires" });
};

main();
