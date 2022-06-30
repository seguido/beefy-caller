const { default: axios } = require("axios");
const { chains } = require("../../config");
const vaultAbi = require("../../abis/vaultAbi.json");
const strategyAbi = require("../../abis/strategyAbi.json");
const { Contract, ethers, BigNumber } = require("ethers");
const { getHarvestingWallet } = require("../../wallet/wallet");
const sleep = require("../../utils");
require("dotenv").config();

const REST = 1500;

var strategies = [
];

const getAuroraStrategies = async () => {
  const url = `https://api.beefy.finance/vaults`;
  let vaults = (await axios.get(url)).data;
  const vaultArray = vaults.filter(v => v.chain === 'aurora');

  let vaultAddresses = vaultArray
    .filter(vault => !vault.depositsPaused && !vault.name.endsWith('-eol') && vault.status != 'eol')
    .map((vault) => vault.earnedTokenAddress);

  const provider = new ethers.providers.JsonRpcProvider({
    url: chains[1313161554].rpc,
    timeout: 20000,
  });
  console.log(vaultAddresses);

  var newStrategies = [];
  for (const vaultAddress of vaultAddresses) {
    const vaultContract = new Contract(vaultAddress, vaultAbi, provider);
    const strategy = await vaultContract.strategy();
    await sleep(REST);
    newStrategies.push(strategy);
  }

  console.log(newStrategies);
  console.log(`Aurora strategies loaded: ${newStrategies.length}`)
  strategies = newStrategies;
};

const harvestStrategies = async () => {
  const provider = new ethers.providers.JsonRpcProvider({
    url: chains[1313161554].rpc,
    timeout: 20000,
  });
  const wallet = getHarvestingWallet(provider);
  for (const strat of strategies) {
    const strategyContract = new Contract(strat, strategyAbi, wallet);
    // console.log('Checking ' + strat)
    try {
        await conditionalHarvest(strategyContract, provider,strat);
    } catch (err) {
        console.log('failed on strategy');
        console.log(err.message);
    }
    await sleep(REST);
  }
};

const conditionalHarvest = async (strategyContract, provider,strat) => {
  let lastHarvest = await strategyContract.lastHarvest();
  let currentTs = Date.now()/1000;
  if (currentTs - lastHarvest > 18*3600) {
    await sleep(REST);

    try {
      console.log('testing static harvest call ' + strat);
      await strategyContract.callStatic.harvest();
      console.log('passed static call');
    } catch (err) {
      console.log(err.message);
      console.log('FAILED STATIC CALL');
      return;
    }

    await sleep(REST);
    let tx = await strategyContract.harvest();
    // console.log(tx)
    await sleep(REST);

    tx = await tx.wait();

    // console.log(tx)
    tx.status === 1
      ? console.log(`Harvested ${strat} with tx: ${tx.transactionHash}`)
      : console.log(
          `Harvest failed ${strat} with tx: ${tx.transactionHash}`
        );
  } else {
      // console.log('shouldnt harvest');
  }
};

const start = async () => {
  await getAuroraStrategies();
  while(true) {
      await harvestStrategies();
  }
};
// start();


module.exports = {
  getAuroraStrategies,
  harvestStrategies
}