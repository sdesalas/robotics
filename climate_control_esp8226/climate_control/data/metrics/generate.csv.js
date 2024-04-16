const fs = require('fs');

function generateReadings(baseTemp, readings, units, varianceTemp, cycles) {
  const length = readings*units;
  return Array(length).fill(0).map((t,i) => Math.round(baseTemp * 10 + Math.sin(i/(length/cycles/(Math.PI*2))) * varianceTemp * 10));
};


// 24h | every 5 minutes | 12 readings x 48h | variance +/- 2 degrees | 2 x day cycles
const tinside = generateReadings(19, 12, 48, 1.3, 2);
// 24h | every 5 minutes | 12 readings x 48h | variance +/- 10 degrees | 2 x day cycles
const toutside = generateReadings(16, 12, 48, 10, 2);
// 48h | onoff
const onoff = tinside.map((t, i) => {
  if (t < 20 && toutside[i] > t + 2) return 1;
  return 0;
});

const filename = './metrics.000.csv';

if (fs.existsSync(filename)) fs.rmSync(filename)

const f = fs.createWriteStream(filename, {flags: 'a'});

for(let i = 0; i < tinside.length;i++) {
  f.write(`${tinside[i]},${toutside[i]},${onoff[i]}\n`);
}

f.end();
