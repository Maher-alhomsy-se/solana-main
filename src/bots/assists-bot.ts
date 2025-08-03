import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';

import { assistsValidAddress, getCurrentRound, splitTokens } from '../utils';
import { txCollection, tokensCollection, balanceCollection } from '../lib/db';

const BOT_TOKEN = process.env.ASSISTS_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is not set in .env');
}

let bot: TelegramBot;

function createBot() {
  const b = new TelegramBot(BOT_TOKEN!, { polling: true });

  b.on('polling_error', (err) => {
    console.log('Polling error in assits bot: \n');
    console.log(err.message, '\n');

    restartBot();
  });

  return b;
}

function restartBot() {
  try {
    console.log('Restarting assists bot polling... \n');

    bot
      .stopPolling()
      .then(() => {
        bot = createBot();
      })
      .catch(console.error);
  } catch (e) {
    console.error('Failed to restart assists bot: ', e, '\n');
  }
}

bot = createBot();

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;

  const message = `👋 *Welcome to Solana Ritual Bot!*

Invest in memecoins through the power of our expert callers.

🔮 *Once you send SOL, the ritual begins.*

💀 *No mercy for fat\\-fingered apes \\— your tokens are sealed by fate.*

📈 Auto\\-buy calls from trusted alpha hunters.  
Track your balance, see what was bought, and ride the wave.

*Ready to ape?* Just send, sit back, and let the spirits trade for you.

➡️ Available commands:\\n
/to \\- Get deposit address  
/total \\- View tokens bought in the last 7 days  
/my\\_balance \\- Check your current balance`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Handle /to command
bot.onText(/^\/to$/, (msg) => {
  const chatId = msg.chat.id;

  const message = `🚀 *Start Investing Now!*

To participate, please send at least *0.001 SOL* to the address below:

\`\`\`
HL5bfDCFR4EdnP4b9HZk3mAXFQpM6T89nBJSASpWr9KC
\`\`\`

Once the transaction is confirmed, you'll be automatically added to the system.`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Handle /total command
bot.onText(/^\/total$/, async (msg) => {
  const now = new Date();
  const chatId = msg.chat.id;

  const roundDoc = await getCurrentRound();

  if (!roundDoc) {
    console.log('❌ There is no round in total command \n');
    return;
  }

  const tokens = await tokensCollection
    .find({ round: roundDoc.round })
    .sort({ boughtAt: 1 })
    .toArray();

  const doc = await balanceCollection.findOne({
    // @ts-ignore
    _id: 'wallet-balance',
  });

  if (!doc) return null;

  const totalBalance = doc.totalBalance.toFixed(4);

  let roundRemaining = 'Unknown';

  if (roundDoc.endDate) {
    const roundEnd = new Date(roundDoc.endDate);
    const ms = roundEnd.getTime() - now.getTime();

    if (ms > 0) {
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      roundRemaining = `${days}d ${hours}h ${minutes}m remaining`;
    } else {
      roundRemaining = '⏳ Round ended. Awaiting next cycle.';
    }
  }

  if (!tokens.length) {
    return bot.sendMessage(
      chatId,
      `<i>No tokens bought in the last 7 days.</i>`,
      { parse_mode: 'HTML' }
    );
  }

  const messages = splitTokens(tokens);

  for (let i = 0; i < messages.length; i++) {
    let text;

    if (i === 0) {
      text = `📊 <b>Weekly Summary</b>\n\n<b>🪙 Tokens bought in the last 7 days:</b>\n${messages[i]}\n\n<b>💰 Total USDT Balance:</b> <code>${totalBalance} USDT</code>\n<b>⏳ Time left in current round:</b> ${roundRemaining}`;
    } else text = messages[i];

    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }
});

// Handle /my-balance command
bot.onText(/^\/my_balance$/, async (msg) => {
  const chatId = msg.chat.id;

  const doc = await balanceCollection.findOne({
    // @ts-ignore
    _id: 'wallet-balance',
  });

  if (!doc) return null;

  const message = `📬 *Please send your Solana wallet address:*\n\nWe'll check your balance and get back to you.`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

bot.on('text', async (msg) => {
  if (!msg.text) {
    console.log('There is no text in assists bot \n');
    return;
  }

  const commands = ['/to', '/total', '/my_balance', '/start'];

  const isCommand = commands.includes(msg.text);

  if (isCommand) return;

  const input = msg.text?.trim();

  const isValid = assistsValidAddress(input);

  if (!isValid) {
    bot.sendMessage(
      msg.chat.id,
      `❌ *Invalid Solana address.*\nPlease double-check and try again.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const txList = await txCollection.find({ from_address: input }).toArray();

  if (txList.length === 0) {
    bot.sendMessage(
      msg.chat.id,
      `⚠️ *Address not found in our system.*\nNo transactions recorded for:\n\`${input}\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const userTotal = txList.reduce((sum, tx) => sum + Number(tx.value), 0);

  console.log(`The total balance of ${input} is ${userTotal} \n`);

  const balanceDoc = await balanceCollection.findOne({
    // @ts-ignore
    _id: 'wallet-balance',
  });

  const totalBalance = balanceDoc?.totalBalance ?? 0;

  const percentage =
    totalBalance > 0 ? ((userTotal / totalBalance) * 100).toFixed(2) : '0.00';

  bot.sendMessage(
    msg.chat.id,
    `✅ *Your Contribution:*\n` +
      `💵 Amount Sent: \`${userTotal.toFixed(4)} USDT\`\n` +
      `📊 Share of Total Pool: \`${percentage}%\``,
    { parse_mode: 'Markdown' }
  );
});

export default bot;
