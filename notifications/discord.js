const { default: axios } = require("axios")

const notifyOutOfGas = async (chain) => {
  try {
    await axios.post(`https://discord.com/api/webhooks/1033110030985199667/${process.env.DISCORD_HOOK_TOKEN}?thread_id=901497804038504528`, 
    {
      content: `After some advanced calculus analysis, I've determined that __**${chain}**__ will run out of gas to harvest in less a week`
    });
  } catch (err) {
    console.log('failed to post to discord hook');
    console.log(err.message);
  }
}

module.exports = {notifyOutOfGas}