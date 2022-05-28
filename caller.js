require("dotenv").config();
const { ethers } = require("ethers");
const cron = require("node-cron");
const { chains } = require("./config");
const { getAuroraStrategies, harvestStrategies } = require("./schedules/auroraHarvesting/auroraHarvester");
const {
  loadBeefyFeeRecipients,
  harvestAll,
} = require("./schedules/feeBatchHarvesting/feeRecipients");
const { checkGasAll } = require("./schedules/gas");

const main = async () => {
  await loadBeefyFeeRecipients();

  // await checkGasAll();
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
