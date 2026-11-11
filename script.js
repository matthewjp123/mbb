// Monetized Brand Builder: application form
// Every application is emailed through Web3Forms (web3forms.com) to the address tied to this access key.
const WEB3FORMS_KEY = "fcacf55f-1c8a-41a4-aa52-37b538bd0b9c";
// Google Calendar booking page. Google sends the invite to whoever books.
const BOOKING_LINK = "https://calendar.app.google/kzdiaFmVCGRtZhWf8";
// Optional: to show the calendar right on the page, paste the src URL from
// Google Calendar > your booking page > Share > Website embed > Inline. It ends in ?gv=true
const BOOKING_EMBED_URL = "";

(function () {
  const form = document.getElementById("apply-form");
  if (!form) return;

  const QUESTIONS = [
    { key: "type", title: "What best describes you?", sub: "Pick the closest fit.", options: ["Creator building a personal brand", "Business owner or service provider", "Coach, consultant or educator", "Performer or entertainer"], dq: [] },
    { key: "size", title: "Where is your audience right now?", sub: "Total followers across every platform.", options: ["Just getting started, under 1K", "1K to 10K", "10K to 100K", "100K plus"], dq: [] },
    { key: "goal", title: "What do you want most in the next 90 days?", sub: "", options: ["Grow a relevant audience", "Turn my audience into income", "Launch or sell an offer", "Fill seats, events or bookings"], dq: [] },
    { key: "learn", title: "How do you usually learn something new for your business?", sub: "Be honest. There's no wrong answer.", options: ["I like figuring it out as I go, even if I get it wrong a few times.", "I want a clear plan, and I'm fine adjusting along the way.", "I want something simple that doesn't make me think too hard.", "If I don't see results fast, I usually move on to something else."], dq: [2, 3] },
    { key: "ready", title: "If this is a fit, when do you want to start?", sub: "", options: ["Right away", "Within the next 30 days", "Within 60 to 90 days", "Just looking for now"], dq: [3] }
  ];
  const TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

  const $ = (sel) => form.querySelector(sel);
  const screens = form.querySelectorAll("[data-screen]");
  const state = { step: 0, answers: {}, day: null, time: null };
  const startedAt = Date.now();

  function show(name) {
    screens.forEach((el) => { el.hidden = el.dataset.screen !== name; });
  }

  function firstName() {
    const n = $("#f-name").value.trim().split(" ")[0];
    return n || "friend";
  }

  function render() {
    const step = state.step;
    const inFlow = step <= 5;
    $("#progress").hidden = !inFlow;
    if (inFlow) {
      $("#step-num").textContent = step + 1;
      $("#back-btn").hidden = step === 0;
      form.querySelectorAll(".seg").forEach((s, i) => s.classList.toggle("on", i <= step));
    }
    form.querySelectorAll(".first-name").forEach((el) => { el.textContent = firstName(); });

    if (step === 0) return show("0");
    if (step >= 1 && step <= 5) {
      const q = QUESTIONS[step - 1];
      $("#q-title").textContent = q.title;
      $("#q-sub").textContent = q.sub;
      $("#q-sub").hidden = !q.sub;
      const box = $("#q-options");
      box.innerHTML = "";
      q.options.forEach((label, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "opt";
        b.style.cssText = "display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:18px 20px;background:#EEE9E0;border:1.5px solid #D9D2C5;border-radius:16px;cursor:pointer;font:inherit;color:#121212;font-weight:500";
        const letter = document.createElement("span");
        letter.textContent = "ABCD"[i];
        letter.style.cssText = "flex:none;width:32px;height:32px;border-radius:10px;background:#F7F4EE;border:1px solid #CFC7B8;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px";
        const text = document.createElement("span");
        text.textContent = label;
        b.append(letter, text);
        b.addEventListener("click", () => pick(q, i));
        box.appendChild(b);
      });
      return show("q");
    }
    if (step === 6) { buildBooking(); return show("book"); }
    if (step === 7) return show("thanks");
    if (step === 8) return show("dq");
  }

  function pick(q, i) {
    state.answers[q.key] = q.options[i];
    state.answers[q.key + "_index"] = i;
    if (state.step < 5) { state.step++; return render(); }
    const dq = QUESTIONS.some((qq) => qq.dq.includes(state.answers[qq.key + "_index"]));
    state.step = dq ? 8 : 6;
    submit(dq ? "disqualified" : "qualified");
    render();
  }

  function buildBooking() {
    $("#cal-open").href = BOOKING_LINK;
    const box = $("#cal-embed");
    if (BOOKING_EMBED_URL && !box.firstChild) {
      const f = document.createElement("iframe");
      f.src = BOOKING_EMBED_URL; f.title = "Book a strategy call"; f.loading = "lazy";
      f.style.cssText = "border:0;width:100%;height:640px;display:block";
      box.appendChild(f); box.hidden = false;
      $("#cal-open").textContent = "Open in a new tab";
      $("#cal-done-wrap").hidden = false;
    }
  }

  function submit(status) {
    // Spam filter: bots fill the hidden field or finish the whole form in seconds.
    if ($("#f-website").value || Date.now() - startedAt < 4000) { console.warn("Blocked as spam"); return; }
    const a = state.answers;
    const name = $("#f-name").value.trim();
    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: status === "qualified" ? "New MBB application (qualified): " + name : "New MBB application (not a fit): " + name,
      from_name: "Monetized Brand Builder",
      Status: status === "qualified" ? "Qualified, sent to booking calendar" : "Disqualified",
      Name: name,
      email: $("#f-email").value.trim(),
      Handle: $("#f-handle").value.trim(),
      "Describes them": a.type || "",
      "Audience size": a.size || "",
      "90 day goal": a.goal || "",
      "Learning style": a.learn || "",
      "Start date": a.ready || ""
    };
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((res) => {
        console.log("Web3Forms:", res);
        if (!res.success) $("#send-error").hidden = false;
      })
      .catch((e) => {
        console.error("Web3Forms error:", e);
        $("#send-error").hidden = false;
      });
  }

  $("#next-contact").addEventListener("click", () => {
    const name = $("#f-name").value.trim();
    const email = $("#f-email").value.trim();
    const ok = name.length > 1 && /.+@.+\..+/.test(email);
    $("#form-err").hidden = ok;
    if (!ok) return;
    state.step = 1; render();
  });
  $("#back-btn").addEventListener("click", () => { state.step = Math.max(0, state.step - 1); render(); });
  $("#cal-open").addEventListener("click", () => { $("#cal-done-wrap").hidden = false; });
  $("#cal-done").addEventListener("click", () => { state.step = 7; render(); });
  $("#restart-btn").addEventListener("click", () => {
    Object.assign(state, { step: 0, answers: {} });
    render();
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  render();
})();

// Count up numbers when they scroll into view
(function () {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const run = (el) => {
    const target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10), suffix = el.dataset.suffix || "";
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach((el) => { el.textContent = (0).toFixed(parseInt(el.dataset.dec || "0", 10)) + (el.dataset.suffix || ""); io.observe(el); });
})();
