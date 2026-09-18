const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const FormData = require('form-data');

const SECRET = process.env.PAYSTACK_SECRET_KEY;
const CDN = 'https://banimal-global-loop.vercel.app/assets';
const BASE = 'https://api.paystack.co/product';

const products = [
  { id: '2598282', img: 'babygrow-black-0-3-COhppmaC.png' },
  { id: '2598283', img: 'babygrow-black-3-6-DFpFlTtO.png' },
  { id: '2598284', img: 'babygrow-black-6-9-CAtZxCqC.png' },
  { id: '2598286', img: 'babygrow-beige-0-3-DWpH9zhC.png' },
  { id: '2598287', img: 'babygrow-beige-3-6-BQnxLg3W.png' },
  { id: '2598291', img: 'babygrow-beige-6-9-CKJv-JZ9.png' },
  { id: '2598292', img: 'babygrow-gray-0-3-SZFJC89Y.png' },
  { id: '2598295', img: 'babygrow-gray-3-6-CoLi__pJ.png' },
  { id: '2598299', img: 'babygrow-gray-6-9-BsoDW7fE.png' },
  { id: '2598300', img: 'babygrow-white-0-3-D_S66xmd.png' },
  { id: '2598302', img: 'babygrow-white-3-6-Dw98L5oQ.png' },
  { id: '2598303', img: 'babygrow-white-6-9-CZFePaHl.png' },
  { id: '2598304', img: 'BR001-B9Svc9IF.png' },
  { id: '2598307', img: 'BR002-m4ScX5Ak.png' },
  { id: '2598308', img: 'BT001-BYDvu1g2.png' },
  { id: '2598310', img: 'BT002-CX4CjBt9.png' },
  { id: '2598314', img: 'BT003-Ynr1ODEe.png' },
  { id: '2598315', img: 'BT004-KZ5X0Ak7.png' },
  { id: '2598316', img: 'BT005-Ce7QfnBe.png' },
  { id: '2598317', img: 'BT007-C5WxSB9Q.png' },
  { id: '2598320', img: 'BT008-Ci-PewEt.png' },
  { id: '2598321', img: 'BT009-BYEat297.png' },
  { id: '2598323', img: 'BT010-pzlVe3nP.png' },
];

console.log('SECRET present:', !!SECRET, 'length:', SECRET ? SECRET.length : 0);

async function uploadProduct(p, isFirst) {
  const imgRes = await fetch(`${CDN}/${p.img}`);
  if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());

  const form = new FormData();
  form.append('file', buf, { filename: p.img, contentType: 'image/png' });

  const res = await fetch(`${BASE}/${p.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${SECRET}`, ...form.getHeaders() },
    body: form,
  });
  
  const text = await res.text();
  if (isFirst) {
    console.log('HTTP status:', res.status);
    console.log('Response (first 500):', text.substring(0, 500));
  }
  
  let json;
  try { json = JSON.parse(text); } catch(e) { throw new Error(`Non-JSON response (${res.status}): ${text.substring(0,200)}`); }
  return json;
}

(async () => {
  let ok = 0, fail = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const r = await uploadProduct(p, i === 0);
      if (r.status) { console.log(`OK   ${p.img}`); ok++; }
      else { console.log(`FAIL ${p.img}: ${r.message}`); fail++; }
    } catch (e) {
      console.log(`FAIL ${p.img}: ${e.message}`); fail++;
      if (i === 0) break; // stop after first failure for debugging
    }
  }
  console.log(`\nDone: ${ok} OK, ${fail} failed`);
  if (fail > 0) process.exit(1);
})();
