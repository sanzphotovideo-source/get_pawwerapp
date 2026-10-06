const trialBase = "https://crm.pawwerapp.com/";
let pageLanguage = "en";
try { pageLanguage = localStorage.getItem("pawwer:landing-language") === "es" ? "es" : "en"; } catch {}
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
  document.getElementById("progressFill").style.width = state.progress;
  renderDemoLanguage(pageLanguage);
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
const dialogButtonsEs = ["Organiza el lead", "Prepara un seguimiento", "Empieza tu prueba gratis de 3 días"];
const dialogViewsEs = [
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>Nueva consulta web · Recibida ahora</small></div></div><div class="dialog-contact-meta"><div><span>Qué necesita</span><b>Una primera consulta</b></div><div><span>Cómo te encontró</span><b>Tu sitio web</b></div><div><span>Estado del lead</span><b>Nueva consulta</b></div></div><div class="dialog-message">Un nuevo lead llega con su origen y un lugar claro en tu espacio de trabajo.</div>`,
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>Lead organizado en tu espacio de trabajo</small></div></div><div class="dialog-contact-meta"><div><span>Conversación</span><b>Preguntó por disponibilidad para una consulta</b></div><div><span>Siguiente acción</span><b>Responder con horarios disponibles</b></div></div><div class="dialog-message">El contexto queda a la mano y el equipo puede ver qué sigue.</div>`,
  `<div class="demo-person"><span class="demo-person-avatar">ML</span><div><strong>Maya Lopez</strong><small>Borrador de seguimiento · Listo para revisar</small></div></div><div class="dialog-draft"><small>BORRADOR DE PAWWER</small>Hola Maya, gracias por escribirnos. Me encantará ayudarte a empezar. ¿Te funciona una consulta rápida el martes o el miércoles?</div><div class="dialog-message">Revisa el mensaje, edítalo para que suene a ti y apruébalo antes de enviarlo.</div>`
];
function renderDialog() {
  dialogPanel.innerHTML = pageLanguage === "es" ? dialogViewsEs[dialogStep] : dialogViews[dialogStep];
  document.querySelectorAll("[data-step-dot]").forEach((item, index) => {
    item.classList.toggle("active", index === dialogStep);
    item.classList.toggle("done", index < dialogStep);
    const label = item.lastChild; if (label?.nodeType === 3) label.nodeValue = pageLanguage === "es" ? ["Nuevo lead", "Organizado", "Seguimiento"][index] : ["New lead", "Organized", "Follow-up"][index];
  });
  document.getElementById("dialogNext").innerHTML = `${(pageLanguage === "es" ? dialogButtonsEs : dialogButtons)[dialogStep]} <span>→</span>`;
  document.getElementById("dialogStatus").textContent = pageLanguage === "es" ? (dialogStep === 2 ? "Datos de ejemplo · Tú mantienes el control" : "Datos de ejemplo · No se envía nada") : (dialogStep === 2 ? "Sample data · You stay in control" : "Sample data · Nothing is sent");
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


const campaignCaptions = {
  en: "Finding your next client shouldn’t take your entire afternoon. When you work for yourself, creating a post, making a video and figuring out when to publish can eat into time you need for clients. With PAWWER, describe what you want to create, make content with your brand and organize your posts in Planner. You review the result and decide what goes live. What takes you longer: designing or deciding what to post?",
  es: "Tu próximo cliente no debería costarte toda la tarde. Si trabajas por tu cuenta, diseñar un post, preparar un video y decidir cuándo publicarlo pueden comerse el tiempo que necesitas para atender clientes. En PAWWER describes lo que quieres crear, preparas contenido con tu marca y organizas tus publicaciones en Planner. Tú revisas el resultado y decides qué sale. ¿Qué te quita más tiempo: diseñar o decidir qué publicar?"
};
function setCaptionLanguage(language) {
  const copy = document.getElementById("creativeCopy");
  if (!copy) return;
  copy.textContent = campaignCaptions[language] || campaignCaptions.en;
  document.getElementById("creativeLang").textContent = language === "es" ? "ES artwork" : "ES artwork · EN caption";
  document.querySelectorAll("[data-caption-lang]").forEach((button) => {
    const active = button.dataset.captionLang === language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
document.querySelectorAll("[data-caption-lang]").forEach((button) => button.addEventListener("click", () => { setCaptionLanguage(button.dataset.captionLang); if (button.dataset.captionLang !== pageLanguage) setPageLanguage(button.dataset.captionLang); }));
setCaptionLanguage("es");

document.querySelectorAll("[data-showcase]").forEach((button) => button.addEventListener("click", () => {
  const selected = button.dataset.showcase;
  document.querySelectorAll("[data-showcase]").forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const active = panel.dataset.panel === selected;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  pixelEvent("ViewContent", { content_name: selected === "content" ? "PAWWER content studio preview" : "PAWWER lead journey preview", content_category: "Product showcase" });
}));


const languageToggle = document.getElementById("languageToggle");
const languagePairs = [
  ["The method", "El método"], ["Content & campaigns", "Contenido y campañas"], ["Questions", "Preguntas"], ["Log in", "Iniciar sesión"], ["Start your free trial", "Comienza tu prueba gratis"],
  ["25 years of agency experience, in your hands.", "25 años de experiencia de agencia, en tus manos."], ["Your marketing,", "Tu marketing,"], ["in your hands.", "en tus manos."],
  ["Plan your marketing, create content, manage campaigns, and keep every lead moving—with one practical method built from 25 years of agency experience.", "Planea tu marketing, crea contenido, gestiona campañas y mantén cada lead en movimiento con una metodología práctica respaldada por 25 años de experiencia."],
  ["Start your 3-day free trial", "Empieza tu prueba gratis de 3 días"], ["See how PAWWER works", "Descubre cómo funciona PAWWER"], ["Three days to try the real workspace. No long setup.", "Tres días para probar el espacio de trabajo real. Sin una configuración larga."],
  ["Your leads", "Tus leads"], ["Needs a next step", "Necesita un siguiente paso"], ["Follow-ups due", "Seguimientos pendientes"], ["Today", "Hoy"], ["New lead", "Nuevo lead"], ["Follow up", "Dar seguimiento"], ["Meeting set", "Cita agendada"], ["A helpful next step", "Un siguiente paso útil"], ["Maya asked about pricing. Reply today while the conversation is fresh.", "Maya preguntó por precios. Responde hoy mientras la conversación sigue fresca."], ["Review", "Revisar"], ["+ Add lead", "+ Agregar lead"], ["MONDAY, OCTOBER 5", "LUNES, 5 DE OCTUBRE"], ["Maya Lopez", "Maya López"], ["Website inquiry · 12 min ago", "Consulta web · hace 12 min"], ["Instagram · Yesterday", "Instagram · Ayer"], ["Referral · Yesterday", "Recomendación · Ayer"], ["A calmer way to move a lead forward.", "Una forma más clara de avanzar cada lead."], ["Plan the strategy", "Planea la estrategia"], ["Create the content", "Crea el contenido"], ["Manage campaigns", "Gestiona campañas"], ["Follow up with leads", "Da seguimiento a tus leads"],
  ["Strategy shaped by 25 years in marketing", "Estrategia formada por 25 años en marketing"], ["Content for the channels you use", "Contenido para los canales que usas"], ["Leads with a clear next step", "Leads con un siguiente paso claro"], ["See PAWWER in action", "Mira PAWWER en acción"],
  ["A method for the whole marketing cycle", "Una metodología para todo el ciclo de marketing"], ["Go from a good idea", "Pasa de una buena idea"], ["to a real follow-up.", "a un seguimiento real."], ["Put strategy, content, campaigns, and customer conversations in a rhythm your team can actually keep.", "Integra estrategia, contenido, campañas y conversaciones con clientes en un ritmo que tu equipo pueda mantener."],
  ["Choose a clear goal", "Define un objetivo claro"], ["Start with who you want to reach and what you want your marketing to help them do.", "Empieza por decidir a quién quieres llegar y qué quieres que logre tu marketing."], ["Audience", "Audiencia"], ["Offer", "Oferta"], ["Goal", "Objetivo"],
  ["Plan and create content", "Planea y crea contenido"], ["Turn the strategy into useful campaign ideas and content your team can review and schedule.", "Convierte la estrategia en ideas útiles y contenido que tu equipo pueda revisar y programar."], ["Campaign brief", "Brief de campaña"], ["Content drafts", "Borradores de contenido"],
  ["Connect it to follow-up", "Conéctalo al seguimiento"], ["Keep campaign leads, conversation context, and the next customer action close together.", "Mantén cerca los leads de campañas, el contexto de las conversaciones y la próxima acción con cada cliente."], ["FOLLOW-UP DRAFT", "BORRADOR DE SEGUIMIENTO"], ["Ready for your review", "Listo para revisar"],
  ["One connected method:", "Una metodología conectada:"], ["marketing work that carries from the first idea to the customer follow-up.", "un proceso que acompaña desde la primera idea hasta el seguimiento con cada cliente."], ["Explore the content studio", "Explora el estudio de contenido"],
  ["See a lead move", "Mira cómo avanza un lead"], ["One inquiry.", "Una consulta."], ["A better follow-up.", "Un mejor seguimiento."], ["Explore a sample lead and see how PAWWER turns scattered details into a next step your team can act on.", "Explora un lead de ejemplo y mira cómo PAWWER convierte datos dispersos en un siguiente paso para tu equipo."], ["Walk through the demo", "Recorre la demostración"], ["Sample data. No account needed.", "Datos de ejemplo. No necesitas una cuenta."], ["INTERACTIVE PREVIEW", "VISTA INTERACTIVA"], ["Sample lead", "Lead de ejemplo"], ["Interested in a consultation", "Interesada en una consulta"], ["Website form", "Formulario web"], ["A new inquiry just came in. PAWWER gives it a place to go.", "Acaba de llegar una consulta. PAWWER le da un lugar para avanzar."], ["Start with the new inquiry", "Empieza con la nueva consulta"], ["Organize this lead", "Organiza este lead"], ["The important details stay together", "Los detalles importantes quedan juntos"], ["Draft a follow-up", "Prepara un seguimiento"], ["The lead, its source, and what Maya needs now sit together.", "El lead, su origen y lo que Maya necesita ahora están juntos."], ["You review before anything is sent", "Tú revisas antes de enviar"], ["A clear next action is ready. Your team stays in control.", "La siguiente acción está lista. Tu equipo mantiene el control."],
  ["One idea, ready for more than one channel", "Una idea, lista para más de un canal"], ["Make the content.", "Crea el contenido."], ["Keep the whole picture.", "Conserva la visión completa."], ["From the first campaign concept to the lead who responds, PAWWER helps your team move the work forward in one connected rhythm.", "Desde el concepto de campaña hasta el lead que responde, PAWWER ayuda a tu equipo a avanzar con un proceso conectado."], ["Explore PAWWER for yourself", "Explora PAWWER"], ["THE PAWWER WORKFLOW", "EL FLUJO DE PAWWER"], ["Create content", "Crear contenido"], ["Follow the lead", "Dar seguimiento al lead"],
  ["A real PAWWER content concept", "Un concepto de contenido real de PAWWER"], ["Give every post a purpose.", "Dale un propósito a cada publicación."], ["Start with a clear audience and a useful idea. Prepare the creative and caption, then review it before it goes out.", "Empieza con una audiencia clara y una idea útil. Prepara la creatividad y el texto, y revísalos antes de publicar."], ["CAMPAIGN", "CAMPAÑA"], ["Freelancers · Finding the next client", "Freelancers · Cómo encontrar al próximo cliente"], ["CHANNELS", "CANALES"], ["PAWWER ORIGINAL", "ORIGINAL DE PAWWER"], ["Social post · 1:1", "Publicación social · 1:1"], ["ES artwork", "Arte ES"], ["ES artwork · EN caption", "Arte ES · texto EN"], ["Draft · ready for your review", "Borrador · listo para revisar"], ["Created for the person behind the business.", "Creado para quien está detrás del negocio."], ["A real sample from PAWWER’s content studio, paired with a review-first workflow.", "Una muestra real del estudio de contenido de PAWWER, dentro de un flujo que prioriza la revisión."], ["Make your first draft", "Crea tu primer borrador"],
  ["The work doesn’t stop at the post", "El trabajo no termina en la publicación"], ["Bring the conversation home.", "Lleva la conversación a tu espacio."], ["When a campaign earns a reply, keep the source, the context, and the follow-up visible to the team.", "Cuando una campaña genera una respuesta, deja a la vista el origen, el contexto y el seguimiento para el equipo."], ["Campaign", "Campaña"], ["New lead", "Nuevo lead"], ["Next step", "Siguiente paso"], ["Next step to review", "Siguiente paso por revisar"], ["Reply with available consultation times.", "Responde con los horarios disponibles para una consulta."], ["See it in your workspace", "Míralo en tu espacio de trabajo"], ["PAWWER · LEADS", "PAWWER · LEADS"], ["Sample workspace", "Espacio de ejemplo"], ["YOUR PIPELINE", "TU PIPELINE"], ["Needs a next step", "Necesita siguiente paso"], ["Follow-ups due", "Seguimientos pendientes"], ["+2 today", "+2 hoy"], ["Today", "Hoy"], ["Website inquiry · 12 min ago", "Consulta web · hace 12 min"], ["Instagram · Yesterday", "Instagram · Ayer"], ["Referral · Yesterday", "Recomendación · Ayer"], ["Follow up", "Dar seguimiento"], ["Meeting set", "Cita agendada"], ["A helpful next step", "Un siguiente paso útil"], ["Maya asked about pricing. Reply while the conversation is fresh.", "Maya preguntó por precios. Responde mientras la conversación sigue fresca."], ["Review", "Revisar"], ["Campaign context stays with the lead.", "El contexto de campaña acompaña al lead."], ["Every inquiry gets somewhere to go.", "Cada consulta tiene un lugar para avanzar."], ["Sample CRM data illustrates the flow. Your actual workspace starts with your business.", "Los datos de CRM son solo una muestra del flujo. Tu espacio de trabajo comienza con tu negocio."], ["Start your free trial", "Empieza tu prueba gratis"],
  ["25 years of agency experience", "25 años de experiencia de agencia"], ["Marketing methodology, in the palm of your hand.", "La metodología de una agencia de marketing, en la palma de tu mano."], ["PAWWER turns hard-won agency experience into a practical way to plan, create, manage campaigns, and follow up—so your business can move with more clarity.", "PAWWER convierte la experiencia de agencia en una forma práctica de planear, crear, gestionar campañas y dar seguimiento para que tu negocio avance con claridad."], ["ONE CONNECTED RHYTHM", "UN SOLO RITMO CONECTADO"], ["Set the goal", "Define el objetivo"], ["Follow up and learn", "Da seguimiento y aprende"],
  ["Good to know", "Es bueno saberlo"], ["Questions before you start?", "¿Tienes preguntas antes de empezar?"], ["Try the workflow first, then decide if PAWWER fits your team.", "Prueba primero el flujo y decide si PAWWER encaja con tu equipo."], ["Can I plan and create content in PAWWER?", "¿Puedo planear y crear contenido en PAWWER?"], ["Yes. Use the content calendar to plan posts and prepare drafts for review. AI-assisted content planning is included in Scale and Enterprise. Publishing requires supported social channels to be connected.", "Sí. Usa el calendario de contenido para planear publicaciones y preparar borradores para revisar. La planeación de contenido asistida por IA está disponible en Scale y Enterprise. Para publicar, debes conectar canales sociales compatibles."], ["Is PAWWER more than a CRM?", "¿PAWWER es más que un CRM?"], ["Yes. It brings a practical marketing method, content planning, campaign work, lead organization, and follow-up together, so your team can carry the work from an idea to a customer conversation.", "Sí. Conecta una metodología práctica de marketing, planeación de contenido, campañas, organización de leads y seguimiento para que tu equipo avance desde una idea hasta una conversación con el cliente."], ["What happens in the free trial?", "¿Qué incluye la prueba gratis?"], ["You get three days to explore a real PAWWER workspace and see how its marketing and follow-up tools fit your team. The current signup flow may ask you to choose a plan and add a payment method before the trial starts.", "Tienes tres días para explorar un espacio de trabajo real de PAWWER y ver cómo sus herramientas de marketing y seguimiento encajan con tu equipo. El registro actual puede pedirte elegir un plan y agregar un método de pago antes de iniciar la prueba."], ["Do I need to connect every channel first?", "¿Debo conectar todos mis canales primero?"], ["No. You can plan and create drafts first, then connect supported channels when you are ready to schedule or publish.", "No. Puedes planear y crear borradores primero; conecta los canales compatibles cuando estés listo para programar o publicar."], ["Does the AI send messages automatically?", "¿La IA envía mensajes automáticamente?"], ["PAWWER can help prepare a follow-up. You review the draft and approve it before sending.", "PAWWER puede ayudarte a preparar un seguimiento. Tú revisas el borrador y lo apruebas antes de enviarlo."], ["Can I see the product before signing up?", "¿Puedo conocer el producto antes de registrarme?"], ["Yes. The interactive preview above uses sample data and does not require an account.", "Sí. La vista interactiva utiliza datos de ejemplo y no requiere una cuenta."],
  ["Your marketing, with a method behind it", "Tu marketing, respaldado por una metodología"], ["Put 25 years of agency experience", "Pon 25 años de experiencia de agencia"], ["to work for your business.", "al servicio de tu negocio."], ["Sign up opens in PAWWER.", "El registro se abre en PAWWER."], ["Good follow-up starts with a clear next step.", "Un buen seguimiento empieza con un siguiente paso claro."], ["Terms", "Términos"], ["Privacy", "Privacidad"], ["Built for the people behind the business.", "Creado para las personas detrás del negocio."], ["Cookie preferences", "Preferencias de cookies"], ["Choose how PAWWER measures visits", "Elige cómo PAWWER mide las visitas"], ["We use optional advertising cookies to understand which campaigns bring people here. You can change your choice at any time.", "Usamos cookies publicitarias opcionales para saber qué campañas atraen visitas. Puedes cambiar tu elección en cualquier momento."], ["Necessary only", "Solo necesarias"], ["Allow advertising cookies", "Permitir cookies publicitarias"], ["PAWWER IN ACTION", "PAWWER EN ACCIÓN"], ["One lead. One clear next step.", "Un lead. Un siguiente paso claro."], ["Move Maya's sample inquiry through a real follow-up flow.", "Acompaña la consulta de ejemplo de Maya en un flujo real de seguimiento."], ["New lead", "Nuevo lead"], ["Organized", "Organizado"], ["Follow-up", "Seguimiento"], ["Sample data · Nothing is sent", "Datos de ejemplo · No se envía nada"], ["Sample data · You stay in control", "Datos de ejemplo · Tú mantienes el control"], ["Organize the lead", "Organiza el lead"], ["Prepare a follow-up", "Prepara un seguimiento"]
];
const languageMap = new Map(languagePairs);
const reverseLanguageMap = new Map(languagePairs.map(([en, es]) => [es, en]));
const pageSourceText = new WeakMap();
const pageSourceAttrs = new WeakMap();
function capturePageSource(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node; while ((node = walker.nextNode())) if (!pageSourceText.has(node)) pageSourceText.set(node, node.nodeValue);
  root.querySelectorAll("[aria-label]").forEach((el) => { if (!pageSourceAttrs.has(el)) pageSourceAttrs.set(el, el.getAttribute("aria-label")); });
}
capturePageSource(document.body);
function translateText(text, language) {
  const normalized = text.replace(/[^\S\r\n]+/g, " ").trim();
  if (language === "en") return reverseLanguageMap.get(normalized) || text;
  if (languageMap.has(normalized)) return languageMap.get(normalized);
  return text;
}

function translateTree(root, language) {
  capturePageSource(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const source = pageSourceText.get(node) ?? node.nodeValue;
    if (!source.trim()) continue;
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    const original = source.trim();
    node.nodeValue = leading + translateText(original, language) + trailing;
  }
  root.querySelectorAll("[aria-label]").forEach((item) => {
    const original = pageSourceAttrs.get(item) || item.getAttribute("aria-label");
    item.setAttribute("aria-label", language === "es" ? translateText(original, language) : original);
  });
}
function renderDemoLanguage(language) {
  const state = demoCopy[demoStep];
  document.getElementById("stepLabel").textContent = language === "es" ? `Paso ${demoStep + 1} de 3` : `Step ${demoStep + 1} of 3`;
  document.getElementById("demoHint").textContent = translateText(state.hint, language);
  document.getElementById("demoInsight").textContent = translateText(state.insight, language);
  const next = document.getElementById("demoNext");
  next.innerHTML = `${translateText(state.button, language)} <span>→</span>`;
  if (demoStep === 2) next.onclick = () => window.location.assign(trialUrl());
  if (dialog.open) renderDialog();
}
function setPageLanguage(language) {
  pageLanguage = language === "es" ? "es" : "en";
  try { localStorage.setItem("pawwer:landing-language", pageLanguage); } catch {}
  document.documentElement.lang = pageLanguage;
  translateTree(document.body, pageLanguage);
  languageToggle.textContent = pageLanguage === "en" ? "ES" : "EN";
  languageToggle.setAttribute("aria-label", pageLanguage === "en" ? "Cambiar idioma a español" : "Switch language to English");
  setCaptionLanguage(pageLanguage);
  renderDemoLanguage(pageLanguage);
}
languageToggle.addEventListener("click", () => setPageLanguage(pageLanguage === "en" ? "es" : "en"));
setPageLanguage(pageLanguage);
