const chains = {
  56: {
    id: 56,
    name: "bsc",
    rpc: "https://bsc-dataseed.binance.org/",
  },
  128: {
    id: 128,
    name: "heco",
    rpc: "https://http-mainnet.hecochain.com",
  },
  25: {
    id: 25,
    name: "cronos",
    rpc: "https://evm-cronos.crypto.org",
  },
  1666600000: {
    id: 1666600000,
    name: "one",
    rpc: "https://api.harmony.one",
  },
  137: {
    id: 137,
    name: "polygon",
    rpc: "https://polygon-rpc.com",
  },
  250: {
    id: 250,
    name: "fantom",
    rpc: "https://rpc.ftm.tools",
  },
  1285: {
    id: 1285,
    name: "moonriver",
    rpc: "https://rpc.api.moonriver.moonbeam.network",
  },
  42161: {
    id: 42161,
    name: "arbitrum",
    rpc: "https://arb1.arbitrum.io/rpc",
  },
  42220: {
    id: 42220,
    name: "celo",
    rpc: "https://forno.celo.org",
  },
  43114: {
    id: 43114,
    name: "avax",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
  },
  122: {
    id: 122,
    name: "fuse",
    rpc: "https://rpc.fuse.io",
  },
  1088: {
    id: 1088,
    name: "metis",
    rpc: "https://andromeda.metis.io/?owner=1088",
  },
  1313161554: {
    id: 1313161554,
    name: "aurora",
    rpc: process.env.AURORA_RPC  || "https://mainnet.aurora.dev",
  },
  1284: {
    id: 1284,
    name: "moonbeam",
    rpc: "https://rpc.api.moonbeam.network",
  },  
};

module.exports = { chains };
