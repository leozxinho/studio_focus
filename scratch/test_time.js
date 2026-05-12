
const timeStr = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date()).replace('h', ':').trim();

console.log('Time string:', timeStr);
console.log('Length:', timeStr.length);
for (let i = 0; i < timeStr.length; i++) {
  console.log(`Char at ${i}: ${timeStr.charCodeAt(i)} (${timeStr[i]})`);
}
