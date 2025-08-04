import TelegramBot from 'node-telegram-bot-api';

interface Props {
  bot: TelegramBot;
  restarting: { value: boolean };
  createBot: () => TelegramBot;
}

function scheduleRestart({ bot, restarting, createBot }: Props) {
  if (restarting.value) return;
  restarting.value = true;

  console.log('Scheduling assists bot restart in 5s...\n');

  setTimeout(() => {
    bot
      .stopPolling({ cancel: true })
      .catch(() => {})
      .finally(() => {
        bot = createBot();
        restarting.value = false;
        console.log('✅ Assists bot restarted\n');
      });
  }, 5000);
}

export default scheduleRestart;
