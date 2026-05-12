
const fakeDate = new Date();
fakeDate.setHours(8, 5, 0);

const timeStr = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(fakeDate).replace('h', ':').trim();

console.log('Time string (8:05):', timeStr);
