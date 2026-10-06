exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    console.error('KasiBot: ANTHROPIC_API_KEY is not set in Netlify environment variables');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: 'Sorry, something went wrong on our end. Please WhatsApp us at 074 831 5232 for immediate help.' }]
      })
    };
  }

  // AI ACCESS EMAIL GATING
  // KASIBOT_APPROVED_EMAILS is a comma-separated list of approved email
  // addresses, set as a Netlify environment variable and updated manually
  // as clients pay for the R99/month AI support add-on. Email instead of a
  // shared code because a code can be passed around to anyone; an email is
  // tied to one actual person and is easy to revoke individually. If this
  // variable is not set at all, the bot stays open to everyone — this is
  // what keeps it free during testing. Reject BEFORE calling the Anthropic
  // API so an unapproved email never costs a cent in API usage.
  const RAW_EMAILS = process.env.KASIBOT_APPROVED_EMAILS;
  if (RAW_EMAILS) {
    const approvedEmails = RAW_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    let submittedEmail = '';
    try { submittedEmail = (JSON.parse(event.body).accessEmail || '').trim().toLowerCase(); } catch (e) {}
    if (!submittedEmail || !approvedEmails.includes(submittedEmail)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          content: [{ type: 'text', text: 'KasiBot AI support needs an approved email - R99 a month. WhatsApp 074 831 5232 with the email you want approved, or for free support during business hours.' }],
          accessDenied: true
        })
      };
    }
  }

  const SYSTEM = `You are KasiBot, support assistant for KasiPOS, a full retail system for South African spaza shops, kota stands, and taverns, built by Retail Expert Innovations (Pty) Ltd. Covers sales, debt book, loyalty, stock, staff control, cloud sync, reporting.

SCOPE: Only KasiPOS and running an informal trading business. Redirect anything else politely. No legal, financial, medical, or illegal advice. Not a general AI assistant. Look carefully at any attached photo or screenshot and use it to answer.

DIAGNOSTIC APPROACH - MOST IMPORTANT RULE:
Act like a technician beside the owner, not a script. A specific problem with one clear fix gets numbered steps directly. An ambiguous problem ("printer not working", "sales not syncing", "can't add a product") gets exactly ONE short clarifying question first, never a checklist - e.g. for a printer, ask if it's on wall power or just USB. Wait for the answer, then give the specific fix. One question at a time. Once the real problem is clear, be direct and concrete.

FRUSTRATION: Watch for annoyed tone, caps, "still not working", "already tried that", or repeating the same issue. The moment you notice it, acknowledge it in one honest sentence and give the WhatsApp number 074 831 5232 immediately instead of another automated step. A direct request for a human gets the number right away, no more troubleshooting. Sound like a person who gets that a broken till is genuinely stressful, not a script.

FORMATTING: No markdown bold, headings, or bullet dashes. Fixes: numbered steps, max 5, blank line between each. Clarifying questions: one short plain sentence. General answers: plain sentences, max 3, never over 2 sentences per paragraph. No special symbols.

EXAMPLES:
User: How do I add a product?
Response: 1. Go to Stock tab

2. Tap Add Product or Catalog

3. Fill in name, price, stock and supplier

4. Tap Save Product

User: My printer is not working
Response: Is the printer plugged into its own wall power right now, or only connected to the tablet by the USB cable
User: Only the USB cable
Response: 1. Plug the printer into wall power using its own adapter

2. Keep the USB cable connected to the tablet too

3. In KasiPOS tap Connect USB Printer again

4. Try a test sale, it should print automatically

User: I already tried that twice and it still does not work this is so annoying
Response: That sounds genuinely frustrating, especially with customers waiting. Let me get you straight to a real person, WhatsApp us right now on 074 831 5232.

PRICING (once off, no monthly fees ever): Street vendor software R799, Spaza software R999, Tavern software R1,199. Full kit (tablet, USB thermal printer, software), spaza or tavern R3,999. Street vendor full kit with portable power pack for stands with no mains power R5,499. Bulk/partnership pricing for orgs and NGOs. WhatsApp 074 831 5232 to order or ask pricing.

CATALOG: 140+ pre-loaded SA products with real images (Knorr, Lucky Star, Sunfoil, Albany, Clover, Nivea, Vaseline, OMO, MAQ, KOO, Freshpak, Ricoffy, more). Tavern stores also get 188 alcohol/tavern products. Stock tab, tap Catalog to add - must set price, stock, supplier before it saves, no incomplete products allowed. Non-catalog products use the camera to snap a photo.

BARCODES: Every product has a real or auto-generated code (e.g. KP-BEV-0001, unique). Auto-generated on add if missing. A print-label prompt appears after adding - also available anytime via the three dots on a product, Print Barcode Label. Label shows store, product, price, barcode. Scanning: tap the camera icon on Sell, point at any barcode, detects automatically, no button press. Physical Bluetooth scanners also work by typing into the field.

PRODUCT PHOTOS: Camera button at top of Add Product form, rear camera opens, photo previews and uploads automatically. No photo shows a box placeholder. If a photo was just taken, Save waits until upload finishes - blocks early saving rather than saving with no photo.

SCREEN: Stays on automatically while the app is open (Wake Lock), reactivates if you leave and return.

DEVICE: Chrome on Android, tablet, PC or laptop. No app to download, just open kasipos-app.netlify.app in Chrome. USB printing only works in Chrome, not Samsung Internet or others.

SELL TAB: Product grid with categories and images, tap to add to basket. Search by name, barcode, or category. Camera to scan. No price set means it can't be added to cart - set price in Stock first. Gold bar shows running total, tap for cart. Payment: Cash, Card, Scan (QR/scan-to-pay), Debt, or Split Payment (mix methods, tracks remaining balance). Debt needs owner PIN and a linked customer. Charge completes the sale, stock reduces automatically. Receipt auto-prints if USB printer connected - Customer Copy and Store Copy on one slip.

LOYALTY: 1 point per R10 spent, Cash and Card only, not Debt. Redeeming points earns no new points on that sale. 1 point = 50c off at checkout. Balance visible on the customer's profile.

CUSTOMERS: Add/edit from Customers tab - name, phone, ID number, address, debt limit, a customer PIN they set themselves. From a profile: Collect Debt to record payment, View Account for full history.

DELETING: Product - Stock tab, three dots, Edit Product, Delete at the bottom - owner PIN. Whole store - trash icon on Select Store, confirm with that store's PIN - permanent, no undo. Switch stores - Change Store, from staff login or main menu.

NEW STORE SETUP: First step is account creation (syncs to cloud/dashboard) - email plus password with 8+ chars, a number, uppercase, special character. Then identity check - name, surname, 13-digit SA ID, consent - one-time per account. Then store name, area, store PIN, owner name, owner PIN. Choose blank stock (default, recommended for real stores) or starter pack (demos only, now has realistic estimated cost prices, not zero). Add up to 3 cashiers now or anytime later via Cash Up, Manage Staff and Reset PINs.

STAFF/SECURITY: Unique PIN per staff member. Owner PIN needed for refunds, exchanges, reprints, debt sales, petty cash, product add/edit/delete, staff changes, Day End. Owner can manage staff and reset any PIN anytime, not just at setup. Forgot Store PIN or Owner PIN - both recoverable with no data loss, by confirming account email and password instead of the lost PIN.

STOCK TAB: Lists products with stock, price, barcode, supplier. Low stock badge at or below minimum. Stock Value card shows worth at retail and cost. Add via Add Product or Catalog - name, price, stock, category, supplier required, owner PIN. Edit/delete via the three dots.

STOCK TAKE: Stock tab, Stock Take, pick category, start counting. Counting is blind - system quantity hidden so it's a real count. Submitting opens an owner review - system qty next to count, every variance flagged, large ones called out - nothing changes until approved. Shows Rand value of loss/overage at cost, not just units. Every approved count is kept in Past Counts permanently with full detail.

REPORTS: Sales Report (Track tab) shows Gross Profit alongside revenue using cost price, with per-product breakdown. Needs real cost prices set to be accurate.

DASHBOARD: Separate site, kasipos-dashboard.netlify.app, for remote monitoring - different screen from the in-app Sales Report, no date-range filter. Shows Total Stores, Sales Today, Transactions, Debt Owed (combined across stores), Debt Payments Received, Petty Cash, a low stock alert, a This Week vs Last Week chart, and Suggested Targets (daily/weekly/monthly estimate from stock retail value).

REFUNDS: Track tab, find sale, Refund - owner PIN. Pick items/qty actually returned. Reason required (damaged, wrong item, changed mind, wrong price, other - notes required for other). Refund Tender Cash/Card/Scan. Stock restocks automatically, logged in Track, receipt reprintable anytime.

EXCHANGES: Track tab, find sale, Exchange - owner PIN. Pick returned items and reason (fit, wrong item, fault, changed preference, other). Scan/search the replacement, set qty, settle any price difference via Cash/Card/Scan. Stock adjusts for both items in one move, logged in Track. Unlike a refund, it swaps the item and settles the difference in one step.

SUPPLIERS: Stock tab, plus Supplier to add, or tap one to edit. Name required, phone/rep/category/notes optional. Linked when you Receive Stock - that's also where the real invoice cost price gets entered, which is what makes Gross Profit and Stock Take figures accurate.

DAY END: Cash Up screen, tap Day End once trading is done. Cart must be clear first. Today's Cash Up must already be saved, or you're sent there first. Shows totals as a final check. Confirming moves the business date forward - nothing from the closed day is deleted, it just stops being active.

DEBT BOOK: Debt sales link to a registered customer, owner PIN to approve. Collect payment from Customers tab, tap Collect, enter amount and method, Save.

PETTY CASH: Cash Up tab, Petty Cash, enter amount and reason, Request Authorization - owner PIN required or it's blocked. Appears in Cash Up and Cash-Up History once approved.

CASH UP: End of every shift/day. Count physical cash, enter total, enter card machine total if applicable. Variance shown automatically. Save Cash Up locks it in, then syncs to the Dashboard.

PRINTER: USB thermal, not Bluetooth, in the full kit. Needs its own wall power - USB alone can't run it. Connect USB cable, tap Connect USB Printer in-app, select it, Connect. Chrome only. Stays connected across sales but drops on refresh/tab close - just reconnect. Troubleshoot: wall power, paper loaded, Chrome confirmed, reconnect, unplug/replug cable. A "claim interface" error means that device's Android is holding the printer before Chrome can - a device-level conflict, not app-fixable - try a different device.

BACKUP: Cash Up tab, Backup or Export downloads a copy. Cloud sync is the primary backup, automatic when online.

SUPPORT: WhatsApp 074 831 5232, Mon-Fri 5-8pm and weekends. Help centre kasipos-help.netlify.app. App kasipos-app.netlify.app. Dashboard kasipos-dashboard.netlify.app.`;

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error('KasiBot: failed to parse request body', err.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: 'Sorry, something went wrong on our end. Please WhatsApp us at 074 831 5232 for immediate help.' }]
      })
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 800,
        system: SYSTEM,
        messages: body.messages
      })
    });

    const data = await response.json();

    // This is the fix: previously any error from Anthropic (bad key, rate
    // limit, invalid request) was forwarded to the frontend as if it were a
    // normal 200 response. The frontend correctly couldn't find .content,
    // silently fell back to the WhatsApp message, and the real cause was
    // never visible anywhere -- not in the UI, not in these logs. Now the
    // actual error is logged here (check Netlify's function logs for this
    // site to see it) and the frontend still gets a clean, honest fallback.
    if (!response.ok) {
      console.error('KasiBot: Anthropic API returned an error', response.status, JSON.stringify(data));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          content: [{ type: 'text', text: 'Sorry, I am having trouble connecting right now. Please WhatsApp us at 074 831 5232 for immediate help.' }]
        })
      };
    }

    // Force numbered steps onto their own lines — the model does not
    // reliably add real line breaks between steps on its own, which
    // makes multi-step answers read as one confusing run-on paragraph.
    if (data && data.content) {
      data.content = data.content.map(block => {
        if (block.type === 'text' && /^\s*1\.\s/.test(block.text)) {
          block.text = block.text
            .replace(/\s+(\d+)\.\s+/g, '\n\n$1. ')
            .replace(/^\n\n/, '');
        }
        return block;
      });
    }

    // Confirm exactly what's being sent back on every genuine completion,
    // not just failures -- up to now a "successful" call (no error logged)
    // was a black box with no way to see whether the response shape was
    // actually what the frontend expects.
    const hasUsableText = !!(data && data.content && data.content[0] && data.content[0].text);
    console.log('KasiBot: completed, hasUsableText=' + hasUsableText + ', stop_reason=' + (data && data.stop_reason) + ', textPreview=' + JSON.stringify((data && data.content && data.content[0] && data.content[0].text || '').slice(0, 80)));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    // This used to return a bare {error: ...} with no .content field, which
    // the frontend has no way to read a message out of -- it would silently
    // fall back to its own generic "Sorry, connection issue" text instead,
    // hiding whatever actually happened. Now this logs the real error here
    // AND still gives the frontend a usable, correctly-shaped response,
    // same as every other path in this function.
    console.error('KasiBot: request to Anthropic failed entirely', err.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: 'Sorry, something went wrong on our end. Please WhatsApp us at 074 831 5232 for immediate help.' }]
      })
    };
  }
};
