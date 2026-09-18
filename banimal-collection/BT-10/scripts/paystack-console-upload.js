/**
 * Banimal Paystack Image Uploader v3 — FINAL
 * Run at dashboard.paystack.com DevTools console
 * Uploads images for all 29 products
 * 2026-06-26
 */
(async () => {
  const CDN = 'https://banimal-global-loop.vercel.app/assets';
  const API = 'https://api.paystack.co';

  const products = [
    // Baby Grows (12)
    { id: '2598282', img: 'babygrow-black-0-3-COhppmaC.png' },
    { id: '2598283', img: 'babygrow-black-3-6-DFpFlTtO.png' },
    { id: '2598284', img: 'babygrow-black-6-9-CAtZxCqC.png' },
    { id: '2598286', img: 'babygrow-beige-0-3-DWpH9zhC.png' },
    { id: '2598287', img: 'babygrow-beige-3-6-BQnxLg3W.png' },
    { id: '2598291', img: 'babygrow-beige-6-9-CKJv-JZ9.png' },
    { id: '2598292', img: 'babygrow-gray-0-3-SZFJC89Y.png'  },
    { id: '2598295', img: 'babygrow-gray-3-6-CoLi__pJ.png'  },
    { id: '2598299', img: 'babygrow-gray-6-9-BsoDW7fE.png'  },
    { id: '2598300', img: 'babygrow-white-0-3-D_S66xmd.png' },
    { id: '2598302', img: 'babygrow-white-3-6-Dw98L5oQ.png' },
    { id: '2598303', img: 'babygrow-white-6-9-CZFePaHl.png' },
    // Round Bibs (2)
    { id: '2598304', img: 'BR001-B9Svc9IF.png' },
    { id: '2598307', img: 'BR002-m4ScX5Ak.png' },
    // Bandana Bibs (9)
    { id: '2598308', img: 'BT001-BYDvu1g2.png' },
    { id: '2598310', img: 'BT002-CX4CjBt9.png' },
    { id: '2598314', img: 'BT003-Ynr1ODEe.png' },
    { id: '2598315', img: 'BT004-KZ5X0Ak7.png' },
    { id: '2598316', img: 'BT005-Ce7QfnBe.png' },
    { id: '2598317', img: 'BT007-C5WxSB9Q.png' },
    { id: '2598320', img: 'BT008-Ci-PewEt.png' },
    { id: '2598321', img: 'BT009-BYEat297.png' },
    { id: '2598323', img: 'BT010-pzlVe3nP.png' },
    // Sam Fox Digital Art Certificates (4) — redirect_url already set to PDF
    { id: '2598711', img: 'samfox-dream-big-DqhMqlsk.jpg'    },
    { id: '2598712', img: 'samfox-first-eye-BvvyLsxG.jpg'    },
    { id: '2598713', img: 'samfox-rainbow-tata-D-dLbgP7.jpg' },
    { id: '2598714', img: 'samfox-space-puma-BAEkuXl-.jpg'   },
    // Hat (1)
    { id: '2598709', img: 'be-fruitful-hat-B6D_moGp.jpg' },
    // Stroller — no asset in Vercel CDN, skip
    // { id: '2576183', img: null },
  ];

  const tokenKey = Object.keys(localStorage).find(k =>
    k.toLowerCase().includes('token') || k.toLowerCase().includes('access')
  );
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;
  if (!token) { console.error('❌ No auth token — log into dashboard.paystack.com first'); return; }

  console.log(`✅ Token found. Uploading images for ${products.length} products...\n`);
  let ok = 0, fail = 0;

  for (const p of products) {
    try {
      const mime = p.img.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      const imgRes = await fetch(`${CDN}/${p.img}`);
      if (!imgRes.ok) throw new Error(`CDN ${imgRes.status}`);
      const blob = await imgRes.blob();

      const urlRes = await fetch(`${API}/upload_url`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ upload_filename: p.img, upload_path: '/products' })
      });
      const urlData = await urlRes.json();
      if (!urlData.status) throw new Error(`upload_url: ${urlData.message}`);
      const { signed_url, key, path, original_filename } = urlData.data;

      const putRes = await fetch(signed_url, { method: 'PUT', headers: { 'Content-Type': mime }, body: blob });
      if (!putRes.ok) throw new Error(`PUT ${putRes.status}`);

      const updRes = await fetch(`${API}/product/${p.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ files: [{ key: key || path, type: 'image', path, original_filename: original_filename || p.img }] })
      });
      const ud = await updRes.json();
      if (ud.status) { console.log(`✅ ${p.id}  ${p.img}`); ok++; }
      else throw new Error(`update: ${ud.message}`);
    } catch (e) {
      console.error(`❌ ${p.id}  ${p.img}  ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n${'═'.repeat(45)}`);
  console.log(`✅ ${ok} uploaded    ❌ ${fail} failed`);
  console.log('Refresh Paystack dashboard to see images.');
})();
