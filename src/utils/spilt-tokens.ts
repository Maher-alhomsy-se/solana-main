import type { Document, WithId } from 'mongodb';

const MAX_LINKS = 100;
const MAX_CHARS = 3800;

export function splitTokens(tokens: WithId<Document>[]) {
  const messages = [];
  let currentLength = 0;
  let currentMessage: string[] = [];

  tokens.forEach((t, idx) => {
    const line = `${idx + 1}. <a href="https://dexscreener.com/solana/${
      t.mint
    }">${t?.name || t.mint}</a>\n`;
    const lineLength = line.length;

    // If adding this line exceeds limits → push current chunk & reset
    if (
      currentLength + lineLength > MAX_CHARS ||
      currentMessage.length >= MAX_LINKS
    ) {
      messages.push(currentMessage.join(''));
      currentMessage = [];
      currentLength = 0;
    }

    currentMessage.push(line);
    currentLength += lineLength;
  });

  // Push the last chunk if exists
  if (currentMessage.length) {
    messages.push(currentMessage.join(''));
  }

  return messages;
}
