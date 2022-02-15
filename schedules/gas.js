const { ethers } = require("ethers");
const { chains } = require("../config");
const { getHarvestingWallet } = require("../wallet/wallet");

const checkGasAll = async () => {
    for (const chain of Object.values(chains)) {
        const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
        const wallet = getHarvestingWallet(provider);
        let balance = await wallet.getBalance();

        let bal = balance /1e18;

        console.log(`${chain.name} : ${bal}`);
    }
}

module.exports = {
    checkGasAll
};