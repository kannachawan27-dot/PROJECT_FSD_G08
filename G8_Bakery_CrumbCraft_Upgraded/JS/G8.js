/* =========================================
   G8 BAKERY - CUSTOMER EXPERIENCE
   Booking records are stored centrally by the Node.js API.
   localStorage is used only for the temporary cake draft.
========================================= */
async function readApiResponse(response) {
  const responseText = await response.text();
  let result = {};
  if (!responseText.trim()) {
    throw new Error("The booking server returned an empty response. Start the project with `npm start` and open http://localhost:3000 (do not open the HTML file directly or use Live Server).");
  }
  try { result = JSON.parse(responseText); }
  catch {
    throw new Error("The booking server returned an invalid response. Start the project with `npm start` and open http://localhost:3000 (do not use Live Server).");
  }
  if (!response.ok) throw new Error(result.error || `Booking failed (HTTP ${response.status}).`);
  return result;
}

const DRAFT_KEY = "g8CakeDraft";
const EARLY_BIRD_DAYS = 7;
const EARLY_BIRD_DISCOUNT = 10;

function localDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
function daysUntil(dateString) {
  if (!dateString) return -1;
  const [y,m,d] = dateString.split("-").map(Number);
  const target = new Date(y, m-1, d);
  const todayParts = localDateString().split("-").map(Number);
  const today = new Date(todayParts[0], todayParts[1]-1, todayParts[2]);
  return Math.round((target - today) / 86400000);
}

const weight = document.getElementById("weight");
const flavor = document.getElementById("flavor");
const shape = document.getElementById("shape");
const frosting = document.getElementById("frosting");
const decoration = document.getElementById("decoration");
const message = document.getElementById("message");
const totalPrice = document.getElementById("totalPrice");
const previewFlavor = document.getElementById("previewFlavor");
const previewDetails = document.getElementById("previewDetails");
const cakeTiers = document.querySelectorAll(".cake-tier");
const topTier = document.querySelector(".top-tier");
const pickupDate = document.getElementById("pickupDate");
const cakePhoto = document.getElementById("cakePhoto");
const cakePhotoPreview = document.getElementById("cakePhotoPreview");
const cakePhotoHint = document.getElementById("cakePhotoHint");
let inspirationPhotoData = "";

const basePrices = { chocolate: 65000, redvelvet: 75000, mango: 70000 }; // paise/kg
const flavorNames = { chocolate: "Chocolate Truffle", redvelvet: "Red Velvet", mango: "Mango" };

function getPriceDetails(date = pickupDate?.value || "") {
  const selectedFlavor = flavor?.value || "chocolate";
  const selectedWeight = Number(weight?.value || 1);
  const decorationRupees = Number(decoration?.value || 0);
  const basePaise = Math.round((basePrices[selectedFlavor] || 65000) * selectedWeight) + decorationRupees * 100;
  const days = daysUntil(date);
  const discountEligible = days >= EARLY_BIRD_DAYS;
  const discountPaise = discountEligible ? Math.round(basePaise * EARLY_BIRD_DISCOUNT / 100) : 0;
  const finalPaise = basePaise - discountPaise;
  return {
    basePrice: (basePaise / 100).toFixed(2),
    discountPercent: discountEligible ? EARLY_BIRD_DISCOUNT : 0,
    discountAmount: (discountPaise / 100).toFixed(2),
    price: (finalPaise / 100).toFixed(2),
    daysInAdvance: days
  };
}
function getCakeDetails(date = pickupDate?.value || "") {
  const selectedFlavor = flavor?.value || "chocolate";
  const selectedWeight = Number(weight?.value || 1);
  const decorationRupees = Number(decoration?.value || 0);
  const price = getPriceDetails(date);
  return {
    flavor: flavorNames[selectedFlavor] || selectedFlavor,
    weight: selectedWeight,
    shape: shape?.value || "round",
    frosting: frosting?.selectedOptions?.[0]?.textContent || "Chocolate Brown",
    decoration: decorationRupees,
    message: message?.value?.trim() || "",
    photo: inspirationPhotoData,
    basePrice: price.basePrice,
    discountPercent: price.discountPercent,
    discountAmount: price.discountAmount,
    price: price.price
  };
}
function updateCakePreview() {
  if (!weight || !flavor || !shape || !frosting) return;
  const selectedWeight = Number(weight.value);
  cakeTiers.forEach(tier => {
    tier.style.backgroundColor = frosting.value;
    tier.style.borderRadius = shape.value === "round" ? "48%" : shape.value === "heart" ? "45% 45% 10% 10%" : "8px";
  });
  if (topTier) topTier.style.display = selectedWeight >= 2 ? "block" : "none";
  if (previewFlavor) previewFlavor.textContent = flavorNames[flavor.value] || flavor.value;
  if (previewDetails) previewDetails.textContent = `${weight.value} kg · ${shape.value} · ${getCakeDetails().frosting}`;
  const previewMessage = document.getElementById("previewCakeMessage");
  if (previewMessage) previewMessage.textContent = message?.value?.trim() || "Your message appears here";
  renderCakeSpecification();
}
function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[char]));
}
function renderCakeSpecification() {
  const svg = document.getElementById("cakeSpecSvg");
  if (!svg) return;
  const colorOptions = ["#70432f", "#f4a6b8", "#ffffff", "#a8c99b"];
  const color = colorOptions.includes(frosting.value) ? frosting.value : colorOptions[0];
  const isSquare = shape.value === "square";
  const isHeart = shape.value === "heart";
  const bottom = isHeart
    ? `<path d="M260 300 C220 270 105 205 105 155 C105 105 165 85 205 120 C230 85 290 85 315 120 C355 85 415 105 415 155 C415 205 300 270 260 300 Z" fill="${color}" stroke="#563624" stroke-width="5"/>`
    : isSquare
      ? `<rect x="105" y="160" width="310" height="135" rx="13" fill="${color}" stroke="#563624" stroke-width="5"/>`
      : `<path d="M105 190 C105 145 415 145 415 190 L415 285 C415 330 105 330 105 285 Z" fill="${color}" stroke="#563624" stroke-width="5"/><ellipse cx="260" cy="190" rx="155" ry="35" fill="${color}" stroke="#563624" stroke-width="5"/>`;
  const top = Number(weight.value) >= 2
    ? (isSquare
      ? `<rect x="165" y="95" width="190" height="75" rx="12" fill="${color}" stroke="#563624" stroke-width="5"/>`
      : `<ellipse cx="260" cy="130" rx="105" ry="27" fill="${color}" stroke="#563624" stroke-width="5"/><path d="M155 130 L155 170 C155 205 365 205 365 170 L365 130" fill="${color}" stroke="#563624" stroke-width="5"/>`)
    : "";
  const label = escapeXml(message?.value?.trim() || "Your cake").slice(0, 100);
  const title = escapeXml(`${flavorNames[flavor.value]} ${weight.value} kg ${shape.value} cake`);
  svg.innerHTML = `<title>${title}</title><ellipse cx="260" cy="315" rx="175" ry="20" fill="#ead8c8"/>${bottom}${top}<path d="M145 198 Q260 225 375 198" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="5"/><text x="260" y="265" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="${color.toLowerCase()==="#ffffff" ? "#563624" : "#ffffff"}">${label}</text><text x="260" y="345" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#806f64">G8 BAKERY · ${title}</text>`;
}
const downloadCakeSvg = document.getElementById("downloadCakeSvg");
downloadCakeSvg?.addEventListener("click", () => {
  const svg = document.getElementById("cakeSpecSvg");
  if (!svg) return;
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "G8_Bakery_Cake_Design.svg";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});
function calculatePrice() {
  if (!weight || !flavor || !totalPrice) return;
  const price = getPriceDetails();
  totalPrice.textContent = "₹" + Number(price.price).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
  const breakdown = document.getElementById("priceBreakdown");
  if (breakdown) {
    if (price.discountPercent) {
      breakdown.textContent = `Early-bird discount (${EARLY_BIRD_DISCOUNT}%) applied: save ₹${Number(price.discountAmount).toLocaleString("en-IN")} · Base ₹${Number(price.basePrice).toLocaleString("en-IN")}`;
    } else if (pickupDate?.value) {
      breakdown.textContent = `No early-bird discount. Select a date at least ${EARLY_BIRD_DAYS} days ahead to save ${EARLY_BIRD_DISCOUNT}%.`;
    } else {
      breakdown.textContent = `Choose a pickup date ${EARLY_BIRD_DAYS}+ days ahead to save ${EARLY_BIRD_DISCOUNT}%.`;
    }
  }
  updateCakePreview();
}
[weight, flavor, shape, frosting, decoration, message].forEach(element => {
  element?.addEventListener("input", calculatePrice);
  element?.addEventListener("change", calculatePrice);
});
pickupDate?.addEventListener("change", calculatePrice);
if (pickupDate) pickupDate.min = localDateString();

cakePhoto?.addEventListener("change", () => {
  const file = cakePhoto.files?.[0];
  if (!file) {
    inspirationPhotoData = "";
    if (cakePhotoPreview) cakePhotoPreview.hidden = true;
    if (cakePhotoHint) cakePhotoHint.textContent = "Choose a photo to preview your cake inspiration.";
    return;
  }
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    cakePhoto.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert("Please choose an image smaller than 2 MB for this browser demo.");
    cakePhoto.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    inspirationPhotoData = String(reader.result || "");
    if (cakePhotoPreview) {
      cakePhotoPreview.src = inspirationPhotoData;
      cakePhotoPreview.hidden = false;
    }
    if (cakePhotoHint) cakePhotoHint.textContent = "Inspiration image preview (reference only; not an exact cake rendering).";
  };
  reader.readAsDataURL(file);
});

calculatePrice();

const bookingButton = document.getElementById("bookingButton");
const cakeDraftStatus = document.getElementById("cakeDraftStatus");
bookingButton?.addEventListener("click", () => {
  const cake = getCakeDetails();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(cake));
  if (cakeDraftStatus) cakeDraftStatus.textContent = `Cake selected: ${cake.flavor}, ${cake.weight} kg, ₹${cake.price}. Now fill in your pickup details.`;
  document.getElementById("booking")?.scrollIntoView({behavior:"smooth"});
});

const festivalForm = document.getElementById("festivalForm");
const bookingMessage = document.getElementById("bookingMessage");

festivalForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const festival = document.getElementById("festival")?.value;
  const date = pickupDate?.value;
  const time = document.getElementById("pickupTime")?.value;
  if (!name || !phone || !festival || !date || !time) { bookingMessage.textContent = "Please complete all booking details."; return; }
  if (!/^[6-9][0-9]{9}$/.test(phone)) { bookingMessage.textContent = "Please enter a valid 10-digit Indian mobile number."; return; }
  if (date < localDateString()) { bookingMessage.textContent = "Please select today or a future date."; return; }
  let draft;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { draft = null; }
  if (!draft) { bookingMessage.textContent = "Please create your cake and click Continue to Booking first."; return; }
  const submitButton = festivalForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  bookingMessage.textContent = "Submitting your booking...";
  try {
    const response = await fetch("/api/bookings", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body:JSON.stringify({ name, phone, festival, date, time, cake:getCakeDetails(date) }) });
    const result = await readApiResponse(response);
    const booking = result.booking;
    localStorage.removeItem(DRAFT_KEY);
    bookingMessage.textContent = `Thank you ${booking.name}! Your ${booking.cake.flavor} cake booking is confirmed.`;
    renderReceipt(booking);
    festivalForm.reset();
    if (pickupDate) pickupDate.min = localDateString();
    if (cakeDraftStatus) cakeDraftStatus.textContent = "Booking saved. Create another cake to place a new order.";
    if (cakePhoto) cakePhoto.value = "";
    inspirationPhotoData = "";
    if (cakePhotoPreview) cakePhotoPreview.hidden = true;
    calculatePrice();
  } catch (error) { bookingMessage.textContent = error.message || "Unable to connect to the booking server."; }
  finally { submitButton.disabled = false; }
});

function renderReceipt(booking) {
  const area = document.getElementById("receiptArea");
  if (!area) return;
  const cake = booking.cake || {};
  area.innerHTML = `
    <div class="receipt-card">
      <h3>G8 Bakery — Booking Receipt</h3>
      <p><strong>Receipt ID:</strong> ${String(booking.id)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(booking.name)}</p>
      <p><strong>Mobile Number:</strong> ${escapeHtml(booking.phone)}</p>
      <p><strong>Occasion:</strong> ${escapeHtml(booking.festival)}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(booking.date)} · ${escapeHtml(booking.time)}</p>
      <p><strong>Cake:</strong> ${escapeHtml(cake.flavor || "")} · ${escapeHtml(cake.weight || "")} kg</p>
      <p><strong>Shape / Frosting:</strong> ${escapeHtml(cake.shape || "")} / ${escapeHtml(cake.frosting || "")}</p>
      <p><strong>Decoration:</strong> ₹${Number(cake.decoration || 0).toFixed(2)}</p>
      <p><strong>Base price:</strong> ₹${Number(cake.basePrice || cake.price || 0).toFixed(2)}</p>
      <p><strong>Early-bird discount:</strong> ${Number(cake.discountPercent || 0)}% (−₹${Number(cake.discountAmount || 0).toFixed(2)})</p>
      <p><strong>Total:</strong> ₹${Number(cake.price || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> ${escapeHtml(booking.status || "Confirmed")}</p>
      <div class="receipt-actions"><button type="button" id="printReceipt">Print / Save as PDF</button></div>
    </div>`;
  document.getElementById("printReceipt")?.addEventListener("click", () => {
    document.body.classList.add("print-receipt");
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("print-receipt");
    }, { once: true });
    window.print();
  });
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
