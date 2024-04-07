/**
 * Converts a byte 0-255 to a temperature value in 1/4 C increments from 12C (where 20C = 128)
 * Where 0 = -12 C
 * And 255 = 51.57 C
 * @param {number} byte a byte value 0-255
 * @returns {number} a temperature between -12 C and 51.75 C
 */
function byteToTemp(byte) {
  if (typeof byte !== 'number') return 0; // String, Date, null etc.
  else if (!(byte >= 0 || byte <= 0)) return 0; // NaN Infinty
  return Math.round(((byte / 4) - 12) * 100) / 100;
}

async function toTempArray(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return [...new Uint8Array(arrayBuffer)].map(byteToTemp);
}

async function toBitArray(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return [...new Uint8Array(arrayBuffer)];
}

(async () => {

  const tempInside = await fetch('7d.temp.inside.bin').then(r => r.blob()).then(blob => toTempArray(blob));
  const tempOutside = await fetch('7d.temp.outside.bin').then(r => r.blob()).then(blob => toTempArray(blob));
  const onoff = await fetch('7d.onoff.bin').then(r => r.blob()).then(blob => toBitArray(blob));
  const MINUTE = 60*1000;
  const HOUR = 60*MINUTE;
  const DAY = 24*HOUR;
  const duration = 7*DAY;
  const start = Date.now() - duration;
  const tick = duration/tempInside.length;
  const dataInside = tempInside.map((t, i, l) => ({x: start + (i*tick), y: t}));
  const dataOutside = tempOutside.map((t, i, l) => ({x: start + (i*tick), y: t}));
  const dataOnOff = onoff.map((n, i) => ({x: start + (i*tick), y: n*35}))

  const data = {
    labels: [],
    datasets: [
      {
        label: 'Inside',
        data: dataInside,
        borderColor: '#308230',
        backgroundColor: '#308230',
      },
      {
        label: 'Outside',
        data: dataOutside,
        borderColor: '#234b96',
        backgroundColor: '#234b96',
      },
      {
        type: 'bar',
        label: 'Fan',
        data: dataOnOff,
        borderColor: 'rgba(195, 36, 36, 80%)',
        backgroundColor: 'rgba(195, 36, 36, 80%)',
      }
    ]
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      // maintainAspectRatio: false,
      scales: {
        x: {
            type: 'timeseries',
            adapters: { 
              date: {},
            }, 
          },
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '7d Temperatures',
          font: { size: 16 }
        }
      }
    },
  };
  
  new Chart(document.getElementById('chart7d'), config);

})()