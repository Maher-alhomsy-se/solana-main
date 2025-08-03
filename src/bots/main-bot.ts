import dotenv from 'dotenv';
dotenv.config();

import PQueue from 'p-queue';
import TelegramBot from 'node-telegram-bot-api';

import {
  isValidAddress,
  isExecutable,
  swapSolToToken,
  getCurrentRound,
} from '../utils';
import { tokensCollection } from '../lib/db';

// 1️⃣ Load token early
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is not set in .env');
}

// let bot = createBot();
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

  queue.add(() => handleMessage(text));
});

async function handleMessage(text: string) {
  try {
    console.log(`New Address : ${text} \n`);

    const result = await swapSolToToken(text);

    if (!result) {
      console.log('No Result from swap SOL to token\n');
      return;
    }

    const roundDoc = await getCurrentRound();

    if (!roundDoc) {
      console.log('There is no round-doc in handleMessage fun \n');
      return;
    }

    const { name, signature, symbol } = result;

    const doc = await tokensCollection.insertOne({
      name,
      symbol,
      mint: text,
      value: '10$',
      hash: signature,
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
