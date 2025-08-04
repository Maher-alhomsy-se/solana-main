async function formatRemainingTime(_endDate: Date) {
  const now = new Date();
  const endDate = new Date(_endDate);

  let diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    console.log('0m');

    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);

  const minutes = Math.floor(diff / (1000 * 60));

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  result += `${minutes}m`;

  console.log(result);
}

export default formatRemainingTime;
