import dotenv from 'dotenv';
dotenv.config();

import PQueue from 'p-queue';
import TelegramBot from 'node-telegram-bot-api';

import {
  isExecutable,
  getTokenInfo,
  isValidAddress,
  swapSolToToken,
  getCurrentRound,
} from '../utils';
import { tokensCollection } from '../lib/db';

// 1️⃣ Load token early
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is not set in .env');
}

let bot: TelegramBot;
const queue = new PQueue({ interval: 10000, intervalCap: 1 }); // 1 task every 10s

function createBot() {
  const b = new TelegramBot(TELEGRAM_BOT_TOKEN!, { polling: true });

  b.on('polling_error', (err) => {
    console.error('Polling error:', err.message, '\n');

    restartBot();
  });

  return b;
}

function restartBot() {
  try {
    console.log('Restarting bot polling... \n');

    bot
      .stopPolling()
      .then(() => {
        bot = createBot();
      })
      .catch(console.error);
  } catch (e) {
    console.error('Failed to restart bot:', e, '\n');
  }
}

bot = createBot();

bot.on('message', async (msg) => {
  const text = msg.text?.trim();

  if (!text) return;

  const isValid = isValidAddress(text);

  if (!isValid) return;

  const validation = await isExecutable(text);

  if (!validation.valid) {
    console.error('❌ Invalid or non-existent Solana address');
    return;
  }

  const roundDoc = await getCurrentRound();

  if (!roundDoc) {
    console.log('There is no round-doc in message event \n');
    return;
  }

  const active = roundDoc.status === 'active';

  if (!active) {
    console.log('Round finished - bot paused. Skipping buy.');
    return;
  }

  const info = await getTokenInfo(text);

  if (info.mcap > 1000000) {
    console.info('m-cap more than 1 million... skipping');
    return;
  }

  const isExist = await tokensCollection.findOne({ mint: text });

  if (isExist) {
    console.info('Token Already Exist \n');
    return;
  }

  queue.add(() => handleMessage({ token: text, ...info }));
});

type Props = {
  name: string;
  token: string;
  symbol: string;
  decimals: number;
  usdPrice: number;
};

async function handleMessage(props: Props) {
  const { token, decimals, name, symbol, usdPrice } = props;

  try {
    console.log(`New Address : ${token} \n`);

    const roundDoc = await getCurrentRound();

    if (!roundDoc) {
      console.log('There is no round-doc in handleMessage fun \n');
      return;
    }

    const result = await swapSolToToken({ decimals, token });

    if (!result) {
      console.log('No Result from swap SOL to token\n');
      return;
    }

    const { signature, tokenPriceInSol } = result;

    const doc = await tokensCollection.insertOne({
      name,
      symbol,
      usdPrice,
      mint: token,
      hash: signature,
      tokenPriceInSol,
      boughtAt: new Date(),
      round: roundDoc.status === 'active' ? roundDoc.round : roundDoc.round + 1,
    });

    console.log('✅ New Document Inserted: ', doc);
  } catch (error) {
    console.log('Error in FDV');

    console.log(error);
  }
}

export default bot;
