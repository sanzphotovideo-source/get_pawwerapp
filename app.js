const trialBase = "https://crm.pawwerapp.com/";
const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid", "fbclid", "msclkid"];
const consentKey = "pawwer:advertising-consent";
const params = new URLSearchParams(window.location.search);
const firstTouch = {};
for (const key of attributionKeys) {
  const value = params.get(key);
  if (value) firstTouch[key] = value.slice(0, 200);
}
try {
  if (Object.keys(firstTouch).length) {
    const stored = JSON.parse(localStorage.getItem("pawwer:funnel-attribution") || "{}");
    localStorage.setItem("pawwer:funnel-attribution", JSON.stringify({ ...firstTouch, ...stored }));
  }
} catch { /* Tracking storage is optional; the page and demo continue. */ }

function trialUrl() {
  const destination = new URL(trialBase);
  destination.searchParams.set("plan", "starter");
  let campaign = firstTouch;
  try { campaign = JSON.parse(localStorage.getItem("pawwer:funnel-attribution") || "{}"); } catch {}
  for (const key of attributionKeys) if (campaign?.[key]) destination.searchParams.set(key, campaign[key]);
  let consent = null;
  try { consent = localStorage.getItem(consentKey); } catch {}
  if (consent === "granted") {
    destination.searchParams.set("ad_consent", "granted");
    const cookies = Object.fromEntries(document.cookie.split("; ").map((part) => {
      const separator = part.indexOf("=");
      return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
    }));
    if (cookies._fbp) destination.searchParams.set("fbp", cookies._fbp.slice(0, 200));
    if (cookies._fbc) destination.searchParams.set("fbc", cookies._fbc.slice(0, 200));
  }
  return destination.toString();
}
document.querySelectorAll(".js-trial").forEach((link) => link.href = trialUrl());

const cookieBanner = document.getElementById("cookieBanner");
const pixelState = { id: null, ready: false };
function pixelEvent(name, properties = {}, id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`) {
  if (pixelState.ready && typeof window.fbq === "function") window.fbq("track", name, properties, { eventID: id });
  return id;
}
async function enablePixel() {
  if (pixelState.ready) return;
  try {
    const response = await fetch("/api/meta-config", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const config = await response.json();
    if (!config.pixelId) return;
    pixelState.id = config.pixelId;
    (function (f,b,e,v,n,t,s) {
      if (f.fbq) return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version="2.0";n.queue=[];
      t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    })(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", config.pixelId);
    window.fbq("consent", "grant");
    pixelState.ready = true;
    pixelEvent("PageView", {}, `page-${crypto.randomUUID?.() || Date.now()}`);
  } catch { /* Pixel is optional and never blocks the landing. */ }
}
function setConsent(value) {
  try { localStorage.setItem(consentKey, value); } catch {}
  cookieBanner.hidden = true;
  if (value === "granted") enablePixel();
}
let advertisingConsent = null;
try { advertisingConsent = localStorage.getItem(consentKey); } catch {}
if (advertisingConsent === "granted") enablePixel();
else if (advertisingConsent !== "rejected") window.setTimeout(() => { cookieBanner.hidden = false; }, 650);
document.getElementById("acceptCookies").addEventListener("click", () => setConsent("granted"));
document.getElementById("rejectCookies").addEventListener("click", () => setConsent("rejected"));

document.querySelectorAll(".js-trial").forEach((link) => link.addEventListener("click", () => {
  link.href = trialUrl();
  pixelEvent("InitiateCheckout", { content_name: "PAWWER 3-day trial", content_category: "SaaS trial" });
}));

const demoCopy = [
  { label: "Step 1 of 3", progress: "33.33%", hint: "Start with the new inquiry", button: "Organize this lead", insight: "A new inquiry just came in. PAWWER gives it a place to go." },
  { label: "Step 2 of 3", progress: "66.66%", hint: "The important details stay together", button: "Draft a follow-up", insight: "The lead, its source, and what Maya needs now sit together." },
  { label: "Step 3 of 3", progress: "100%", hint: "You review before anything is sent", button: "Start your free trial", insight: "A clear next action is ready. Your team stays in control." },
];
let demoStep = 0;
function advanceDemo() {
  if (demoStep < 2) demoStep += 1;
  const state = demoCopy[demoStep];
  document.getElementById("stepLabel").textContent = state.label;
  document.getElementById("progressFill").style.width = state.progress;
  document.getElementById("demoHint").textContent = state.hint;
  document.getElementById("demoNext").innerHTML = `${state.button} <span>→</span>`;
  document.getElementById("demoInsight").textContent = state.insight;
  if (demoStep === 2) document.getElementById("demoNext").onclick = () => window.location.assign(trialUrl());
}
document.getElementById("demoNext").addEventListener("click", advanceDemo);

const dialog = document.getElementById("demoDialog");
const dialogPanel = document.getElementById("dialogPanel");
let dialogStep = 0;
const dialogViews = [
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>New website inquiry · Received just now</small></div></div><div class="dialog-contact-meta"><div><span>What she needs</span><b>A first consultation</b></div><div><span>How she found you</span><b>Your website</b></div><div><span>Lead status</span><b>New inquiry</b></div></div><div class="dialog-message">A new lead arrives with a source and a clear place in your workspace.</div>`,
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>Lead organized in your workspace</small></div></div><div class="dialog-contact-meta"><div><span>Conversation</span><b>Asked about consultation availability</b></div><div><span>Next action</span><b>Reply with available times</b></div></div><div class="dialog-message">The context is easy to find, and the team can see what should happen next.</div>`,
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>Follow-up draft · Ready for your review</small></div></div><div class="dialog-draft"><small>PAWWER DRAFT</small>Hi Maya, thanks for reaching out. I’d be happy to help you get started. Would Tuesday or Wednesday work for a quick consultation?</div><div class="dialog-message">Review the message, edit it to sound like you, then approve it before sending.</div>`,
];
const dialogButtons = ["Organize the lead", "Prepare a follow-up", "Start your 3-day free trial"];
function renderDialog() {
  dialogPanel.innerHTML = dialogViews[dialogStep];
  document.querySelectorAll("[data-step-dot]").forEach((item, index) => {
    item.classList.toggle("active", index === dialogStep);
    item.classList.toggle("done", index < dialogStep);
  });
  document.getElementById("dialogNext").innerHTML = `${dialogButtons[dialogStep]} <span>→</span>`;
  document.getElementById("dialogStatus").textContent = dialogStep === 2 ? "Sample data · You stay in control" : "Sample data · Nothing is sent";
}
function openDemo() {
  dialogStep = 0;
  renderDialog();
  dialog.showModal();
  pixelEvent("ViewContent", { content_name: "Interactive product demo", content_category: "Product demo" });
}
document.querySelectorAll(".js-open-demo").forEach((button) => button.addEventListener("click", (event) => {
  event.preventDefault();
  openDemo();
}));
document.getElementById("dialogNext").addEventListener("click", () => {
  if (dialogStep === 2) {
    pixelEvent("InitiateCheckout", { content_name: "PAWWER 3-day trial", content_category: "SaaS trial" });
    window.location.assign(trialUrl());
    return;
  }
  dialogStep += 1;
  renderDialog();
});
document.getElementById("dialogClose").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

const menuToggle = document.querySelector(".menu-toggle");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  document.querySelector(".main-nav").classList.toggle("open", open);
});
document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => {
  document.querySelector(".main-nav").classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));
document.getElementById("year").textContent = new Date().getFullYear();
