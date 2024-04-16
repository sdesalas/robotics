const fs = require('fs');

function generateReadings(baseTemp, readings, units, varianceTemp, cycles) {
  const length = readings*units;
  return Array(length).fill(0).map((t,i) => Math.round(baseTemp * 100 + Math.sin(i/(length/cycles/(Math.PI*2))) * varianceTemp * 100) / 100);
};

/**
 * Map Celius temperature to byte 0-255 in increases of 1/4 degree from 12C (where 20C = 128)
 * Where 0 = -12 C
 * And 255 = 51.75 C
 * @param {number} temp A temperature float value in Celsius (ie 23.4)
 * @returns {number} A byte number (0-255)
 */
function tempToByte(temp) {
  if (typeof temp !== 'number') return 0; // String, Date, null etc.
  else if (!(temp >= 0 || temp <= 0)) return 0; // NaN Infinty
  let byte = Math.round((temp + 12) * 4);
  if (byte < 0) return 0;
  if (byte > 255) return 255;
  return byte;
}

function toByteArray(tempArray) {
  return Buffer.from(tempArray.map(tempToByte));
}

// 48h | every 5 minutes | 12 readings x 48h | variance +/- 2 degrees | 2 x day cycles
const t48inside = generateReadings(19, 12, 48, 1.3, 2);
fs.writeFileSync('48h.temp.inside.json', JSON.stringify(t48inside));
fs.writeFileSync('48h.temp.inside.bin', toByteArray(t48inside));
// 48h | every 5 minutes | 12 readings x 48h | variance +/- 10 degrees | 2 x day cycles
const t48outside = generateReadings(19, 12, 48, 10, 2);
fs.writeFileSync('48h.temp.outside.json', JSON.stringify(t48outside));
fs.writeFileSync('48h.temp.outside.bin', toByteArray(t48outside));
// 48h | onoff
const t48onoff = t48inside.map((t, i) => {
  if (t < 20 && t48outside[i] > t + 2) return 1;
  return 0;
});
fs.writeFileSync('48h.onoff.json', JSON.stringify(t48onoff));
fs.writeFileSync('48h.onoff.bin', Buffer.from(t48onoff));
// 7d | every 15min | 4 readings x 24h x 7d | variance +/- 2 degrees | 7 x day cycles
const t7inside = generateReadings(19, 96, 7, 1.3, 7);
fs.writeFileSync('7d.temp.inside.json', JSON.stringify(t7inside));
fs.writeFileSync('7d.temp.inside.bin', toByteArray(t7inside));
// 7d | every 15min | 4 readings x 24h x 7d | variance +/- 10 degrees | 7 x day cycles
const t7outside = generateReadings(18, 96, 7, 10, 7);
fs.writeFileSync('7d.temp.outside.json', JSON.stringify(t7outside));
fs.writeFileSync('7d.temp.outside.bin', toByteArray(t7outside));
// 7d | onoff
const t7onoff = t7inside.map((t, i) => {
  if (t < 20 && t7outside[i] > t + 2) return 1;
  return 0;
});
fs.writeFileSync('7d.onoff.json', JSON.stringify(t7onoff));
fs.writeFileSync('7d.onoff.bin', Buffer.from(t7onoff));
