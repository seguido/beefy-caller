const { Wallet } = require("ethers");

const getHarvestingWallet = (provider) => {
  return new Wallet(process.env.PK, provider);
};

const getBridgeWallet = (provider) => {
  return new Wallet(process.env.BRIDGE_PK, provider);
}

module.exports = {
  getHarvestingWallet,
  getBridgeWallet
};
