const axios = require("axios");
const { Contract, ethers, BigNumber } = require("ethers");
const { chains } = require("../../config");
const { getHarvestingWallet } = require("../../wallet/wallet");
const feeRecipientAbi = require("../../abis/feeRecipientAbi.json");

const chainAddresses = {};

const loadBeefyFeeRecipients = async () => {
  for (const chain of Object.values(chains)) {
    const url = `https://raw.githubusercontent.com/beefyfinance/beefy-api/prod/packages/address-book/address-book/${chain.name}/platforms/beefyfinance.ts`;

    let resp = await axios.get(url);

    let line = resp.data
      .split("\n")
      .filter((line) => line.includes("beefyFeeRecipient"))[0];

    let address = line.split(":")[1].replace(",", "").replace(/'/g, "").trim();

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
    gasLimit: 600000,
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
    return tx.hash;
  } catch (err) {
    console.log("harvest failed");
  }
};

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

    do {

      try {
        await harvestSingle(provider, recipientContract, setPrice, mult, setNonce, chain);
        done = true;

      } catch (err) {
        console.log(`Failed on chain ${chain.name}`);
        console.log(err);

        if (setPrice) mult += 1;
        setPrice = true;
        setNonce = true;
      }

    } while (tries-- >= 0 && !done);
    if (!done) {
      console.log("COMPLETELY FAILED ON " + chain.name);
    }
  }
};

module.exports = {
  loadBeefyFeeRecipients,
  harvestAll,
};

/* 


*/
