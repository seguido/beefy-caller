const axios = require("axios");
const { Contract, ethers, BigNumber } = require("ethers");
const { chains } = require("../../config");
const { getHarvestingWallet } = require("../../wallet/wallet");
const feeRecipientAbi = require("../../abis/feeRecipientAbi.json");
const rewardPoolAbi = require("../../abis/rewardPoolAbi.json");
const { notifyOutOfGas } = require("../../notifications/discord");
const sleep = require("../../utils");

const chainAddresses = {};

const loadBeefyFeeRecipients = async () => {
  for (const chain of Object.values(chains)) {
    const url = `https://raw.githubusercontent.com/beefyfinance/beefy-api/prod/packages/address-book/address-book/${chain.name}/platforms/beefyfinance.ts`;

    const resp = await axios.get(url);

    const line = resp.data
      .split("\n")
      .filter((line) => line.includes("beefyFeeRecipient"))[0];

    const address = line.split(":")[1].replace(",", "").replace(/'/g, "").trim();

    chainAddresses[chain.id] = address;
  }
  console.log(`beefyFeeRecipient addresses loaded:`);
  console.log(chainAddresses);
};

const getChainProvider = (chain) => {
  const provider = new ethers.providers.JsonRpcProvider({
    url: chain.rpc,
    timeout: 30000,
  });

  if (chain.name === "celo") {
    const originalBlockFormatter = provider.formatter._block;
    provider.formatter._block = (value, format) => {
      return originalBlockFormatter(
        {
          gasLimit: BigNumber.from(0),
          ...value,
        },
        format
      );
    };
  }

  return provider;
};

const harvestSingle = async (provider, contract, setPrice, mult, setNonce, chain) => {
  console.log("attempting");

  let options = {
    gasLimit: chain.customGasLimit ?? 850000,
  };

  if (setPrice) {
    let gasPrice = await provider.getGasPrice();
    options.gasPrice = gasPrice * mult;
    console.log(`Estimated gas price ${gasPrice*mult / 1}`);
  }

  if (setNonce) {
    let nonce = await provider.getTransactionCount(
      "0x11744C7c9431A1cA106155a144c84F106F488302"
    );
    options.nonce = nonce;
    console.log(`nonce is ${nonce / 1}`);
  }
  
  try {
    console.log('testing static febatch harvest call ' + contract.address);
    await contract.callStatic.harvest({gasLimit: options.gasLimit});
    console.log('passed static call');
  } catch (err) {
    console.log(err.message);
    console.log('Failed feebatch static call test');
    return;
  }


  let tx = await contract.harvest(options);

  console.log(`gasPrice : ${tx.gasPrice / 1}`);

  console.log(`Transaction sent, awaiting for confirmation : ${tx.hash}`);

  await provider.waitForTransaction(tx.hash, 1, 90000);

  console.log("confirmed: " + tx.hash);
  try {
    tx = await tx.wait();

    tx.status === 1
      ? console.log(`${chain.name} harvested with tx: ${tx.transactionHash}`)
      : console.log(`${chain.name} harvest failed with tx: ${tx.transactionHash}`);
    if (tx.status === 1) done = true;
    if (!tx.effectiveGasPrice) tx.gasPrice = BigNumber.from(gasPrice)
    return tx;
  } catch (err) {
    console.log("harvest failed");
  }
};

const meetsHarvestConditions = async(chain, provider) => {
  if (chain.hourLimit) {
    console.log(`${chain.name} has harvest conditions, checking`);
    try {
      const recipientContract = new Contract(chainAddresses[chain.id], feeRecipientAbi, provider);
      const rewardPool = await recipientContract.rewardPool();
      const rewardPoolContract = new Contract(rewardPool, rewardPoolAbi, provider);
      const endData = await rewardPoolContract.periodFinish();
      let now = Date.now() /1000;
      let hoursTillEnd = Math.ceil((now - endData)/3600);
      return chain.hourLimit < hoursTillEnd ? true : false;
    } catch (err) {
      console.log(`Error checking conditions on ${chain.name}`)
      return false;
    }
  } else {
    return true;
  }
}

const harvestAll = async () => {
  for (const chain of Object.values(chains)) {
    console.log(`Harvesting beefyFeeRecipient on ${chain.name}`);
    console.log(chain.rpc);
    const provider = getChainProvider(chain);

    const recipientContract = new Contract(
      chainAddresses[chain.id],
      feeRecipientAbi,
      getHarvestingWallet(provider)
    );

    let tries = 3;
    let done = false;
    let setPrice = false;
    let setNonce = false;
    let mult = 1;

    
    const shouldHarvest = await meetsHarvestConditions(chain, provider);
    
    if (!shouldHarvest) {
      console.log(`Harvest conditions not met on ${chain.name}`);
      continue;
    }
    
    console.log(`Conditions met on ${chain.name}, proceeding to harvest`);

    let tx;
    
    do {

      try {
        tx = await harvestSingle(provider, recipientContract, setPrice, mult, setNonce, chain);
        if (tx)done = true;

      } catch (err) {
        console.log(`Failed on chain ${chain.name}`);
        console.log(err.message);

        if (setPrice) mult += 1;
        setPrice = true;
        setNonce = true;
      }

      
    } while (tries-- >= 0 && !done);

    if (tx) {
      await checkGasBalance(tx, provider ,getHarvestingWallet(provider).address, chain.name);
    }

    if (!done) {
      console.log("COMPLETELY FAILED ON " + chain.name);
    }
  }
};

const checkGasBalance = async (tx, provider, address, chain) => {
  try {
    const amountOfGasUsed = tx.gasUsed.mul(tx.effectiveGasPrice || tx.gasPrice);
    const gasBalance = await provider.getBalance(address);
    
    if (gasBalance.lt(amountOfGasUsed.mul(BigNumber.from("10")))) await notifyOutOfGas(chain)
  } catch (err) {
    console.log(`Failed to check gas balances on ${chain}`);
    console.log(tx);
  }
}

function calculateDaysBetweenDates (start, end) {}

module.exports = {
  loadBeefyFeeRecipients,
  harvestAll,
};

/* 


*/
