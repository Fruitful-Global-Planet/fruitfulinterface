/**
 * Banimal Care Loop — Paystack Webhook Handler
 * Handles: charge.success → Zoho CRM + Zoho Invoice
 */
const crypto = require('crypto');

function verifySignature(body, signature, secret) {
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  return hash === signature;
}

async function notifyZohoCRM(data, token) {
  await fetch('https://www.zohoapis.com/crm/v2/Contacts', {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{
      Last_Name: data.customer.last_name || data.customer.email,
      First_Name: data.customer.first_name || '',
      Email: data.customer.email,
      Lead_Source: 'Paystack-Banimal',
      Description: `Order ref: ${data.reference} | ZAR ${data.amount / 100}`,
    }]}),
  });
}

async function createZohoInvoice(data, token) {
  const invoice = {
    customer_name: data.customer.name || data.customer.email,
    email: data.customer.email,
    line_items: [{ name: data.metadata?.product_name || 'Banimal Product', quantity: 1, rate: data.amount / 100 }],
    notes: `Paystack ref: ${data.reference}`,
    currency_code: 'ZAR',
  };
  await fetch('https://invoice.zoho.com/api/v3/invoices', {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ JSONString: JSON.stringify(invoice) }),
  });
}

module.exports = async function handler(req, res) {
  const sig = req.headers['x-paystack-signature'];
  if (!verifySignature(JSON.stringify(req.body), sig, process.env.PAYSTACK_SECRET_KEY)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  if (req.body.event === 'charge.success') {
    const d = req.body.data;
    await Promise.all([notifyZohoCRM(d, process.env.ZOHO_CRM_TOKEN), createZohoInvoice(d, process.env.ZOHO_CRM_TOKEN)]);
  }
  res.status(200).json({ received: true });
};
