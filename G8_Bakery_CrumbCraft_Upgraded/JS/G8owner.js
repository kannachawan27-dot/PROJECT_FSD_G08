'use strict';
const DAILY_CAPACITY = 25;
let bookings = [];
const money = value => `₹${Number(value || 0).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}`;
async function api(url, options={}) {
  const response = await fetch(url, { credentials:"same-origin", ...options, headers:{"Content-Type":"application/json", ...(options.headers||{})} });
  const data = await response.json().catch(()=>({}));
  if (response.status === 401) { window.location.href = "G8owner-login.html"; throw new Error("Admin session expired. Please log in again."); }
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function getToday() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getFilteredBookings() {
  const q=(document.getElementById("searchOrder")?.value||"").toLowerCase();
  const status=document.getElementById("statusFilter")?.value||"All", date=document.getElementById("dateFilter")?.value||"";
  return bookings.filter(b=>(b.name||"").toLowerCase().includes(q)&&(status==="All"||b.status===status)&&(!date||b.date===date));
}
function renderDashboard() {
  const today=bookings.filter(b=>b.date===getToday()&&b.status!=="Cancelled");
  document.getElementById("totalOrders").textContent=bookings.length;
  document.getElementById("todayOrders").textContent=today.length;
  document.getElementById("availableCapacity").textContent=Math.max(0,DAILY_CAPACITY-today.length);
  const tbody=document.getElementById("bookingTableBody"); tbody.replaceChildren();
  const filtered=getFilteredBookings();
  if(!filtered.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=10;td.textContent="No matching orders found.";tr.append(td);tbody.append(tr);}
  filtered.forEach(b=>{
    const c=b.cake||{}, tr=document.createElement("tr");
    [b.name,b.phone,b.festival,b.date,b.time,c.flavor,`${c.weight} kg`,money(c.price),b.status].forEach(v=>{const td=document.createElement("td");td.textContent=v??"—";tr.append(td);});
    const actions=document.createElement("td");
    const add=(label,status)=>{const btn=document.createElement("button");btn.type="button";btn.className="order-action-btn";btn.textContent=label;btn.addEventListener("click",()=>updateStatus(b.id,status));actions.append(btn);};
    if(b.status==="Confirmed"){add("Accept","Accepted");add("Cancel","Cancelled");} else if(b.status==="Accepted"){add("Complete","Completed");add("Cancel","Cancelled");}
    const receipt=document.createElement("button");receipt.type="button";receipt.className="order-action-btn";receipt.textContent="Receipt";receipt.addEventListener("click",()=>showAdminReceipt(b));actions.append(receipt);tr.append(actions);tbody.append(tr);
  });
  calculateIngredients();
}
async function loadBookings(){const result=await api("/api/bookings");bookings=result.bookings;renderDashboard();}
async function updateStatus(id,status){try{await api(`/api/bookings/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});await loadBookings();}catch(e){alert(e.message);}}
function calculateIngredients(){
  // Illustrative flavor-specific BOM per kg. The 5% buffer is for preparation loss.
  const recipes={
    "Chocolate Truffle":{requiredFlour:300,requiredSugar:250,requiredButter:200,requiredCream:250,requiredCocoa:35,requiredMango:0},
    "Red Velvet":{requiredFlour:300,requiredSugar:260,requiredButter:190,requiredCream:260,requiredCocoa:15,requiredMango:0},
    "Mango":{requiredFlour:300,requiredSugar:240,requiredButter:180,requiredCream:230,requiredCocoa:0,requiredMango:120}
  };
  const totals={requiredFlour:0,requiredSugar:0,requiredButter:0,requiredCream:0,requiredCocoa:0,requiredMango:0};
  bookings.filter(b=>b.status!=="Cancelled").forEach(b=>{
    const recipe=recipes[b.cake?.flavor]; if(!recipe)return;
    const kg=Number(b.cake?.weight||0);
    Object.keys(totals).forEach(key=>{totals[key]+=recipe[key]*kg;});
  });
  Object.entries(totals).forEach(([id,grams])=>{
    const el=document.getElementById(id); if(el)el.textContent=`${Math.ceil(grams*1.05)} g`;
  });
  return Object.fromEntries(Object.entries(totals).map(([key,grams])=>[key,Math.ceil(grams*1.05)]));
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function showAdminReceipt(b){const c=b.cake||{},win=window.open("","_blank","width=700,height=750");if(!win){alert("Please allow pop-ups to print the receipt.");return;}win.document.write(`<!doctype html><html><head><title>G8 Bakery Receipt</title><style>body{font-family:Arial;padding:30px;color:#2e211b}h1{color:#6b3828}hr{border:0;border-top:1px solid #ddd}p{margin:10px 0}</style></head><body><h1>G8 Bakery — Receipt</h1><hr><p><b>Receipt ID:</b> ${escapeHtml(b.id)}</p><p><b>Customer:</b> ${escapeHtml(b.name)}</p><p><b>Mobile:</b> ${escapeHtml(b.phone)}</p><p><b>Occasion:</b> ${escapeHtml(b.festival)}</p><p><b>Pickup:</b> ${escapeHtml(b.date)} · ${escapeHtml(b.time)}</p><p><b>Cake:</b> ${escapeHtml(c.flavor)} · ${escapeHtml(c.weight)} kg</p><p><b>Shape:</b> ${escapeHtml(c.shape)} · <b>Frosting:</b> ${escapeHtml(c.frosting)}</p><p><b>Decoration:</b> ${money(c.decoration)}</p><p><b>Base:</b> ${money(c.basePrice)}</p><p><b>Discount:</b> ${Number(c.discountPercent||0)}% (${money(c.discountAmount)})</p><h2>Total: ${money(c.price)}</h2><p><b>Status:</b> ${escapeHtml(b.status)}</p><script>window.onload=()=>window.print();</script></body></html>`);win.document.close();}
function exportOrdersToCSV(){const rows=getFilteredBookings();if(!rows.length){alert("No orders available to export!");return;}const headers=["Customer","Mobile","Festival","Pickup Date","Pickup Time","Cake","Weight","Base Price","Discount %","Discount Amount","Final Price","Status"];const data=rows.map(b=>[b.name,b.phone,b.festival,b.date,b.time,b.cake.flavor,b.cake.weight,b.cake.basePrice,b.cake.discountPercent,b.cake.discountAmount,b.cake.price,b.status]);const csv=[headers,...data].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="G8_Bakery_Orders.csv";a.click();URL.revokeObjectURL(url);}
function generatePurchaseOrder(){
  const active=bookings.filter(b=>b.status!=="Cancelled");
  if(!active.length){alert("No active bookings to calculate a purchase order.");return;}
  const ingredients=calculateIngredients();
  const weight=active.reduce((sum,b)=>sum+Number(b.cake?.weight||0),0);
  const area=document.getElementById("purchaseOrderPreview");
  const rows=[["Flour",ingredients.requiredFlour],["Sugar",ingredients.requiredSugar],["Butter",ingredients.requiredButter],["Cream",ingredients.requiredCream],["Cocoa powder",ingredients.requiredCocoa],["Mango purée",ingredients.requiredMango]];
  area.innerHTML=`<div class="purchase-order-sheet"><h2>G8 Bakery — Supplier Purchase Order</h2><p><b>Generated:</b> ${new Date().toLocaleString("en-IN")}</p><p><b>Active orders:</b> ${active.length} &nbsp; <b>Total cake weight:</b> ${weight.toFixed(2)} kg</p><p>Flavor-specific sample BOM estimates, including a 5% preparation buffer. Verify against tested recipes.</p><table><thead><tr><th>Ingredient</th><th>Estimated quantity</th></tr></thead><tbody>${rows.filter(([,grams])=>grams>0).map(([name,grams])=>`<tr><td>${name}</td><td>${grams.toLocaleString("en-IN")} g</td></tr>`).join("")}</tbody></table><p><b>Supplier:</b> ____________________ &nbsp; <b>PO No:</b> G8-${Date.now()}</p><p><b>Authorized by:</b> ____________________</p><button type="button" id="printPurchaseOrder">Print / Save as PDF</button></div>`;
  document.getElementById("printPurchaseOrder").addEventListener("click",()=>{document.body.classList.add("print-purchase-order");window.addEventListener("afterprint",()=>document.body.classList.remove("print-purchase-order"),{once:true});window.print();});
}
document.getElementById("searchOrder")?.addEventListener("input",renderDashboard);document.getElementById("statusFilter")?.addEventListener("change",renderDashboard);document.getElementById("dateFilter")?.addEventListener("change",renderDashboard);document.getElementById("exportOrders")?.addEventListener("click",exportOrdersToCSV);document.getElementById("generatePurchaseOrder")?.addEventListener("click",generatePurchaseOrder);
document.getElementById("adminLogout")?.addEventListener("click",async()=>{try{await api("/api/logout",{method:"POST",body:"{}"});}finally{window.location.href="G8owner-login.html";}});
(async()=>{try{const session=await api("/api/session");if(!session.authenticated)throw Error("Not authenticated");await loadBookings();}catch(e){if(e.message!=="Admin session expired. Please log in again.")window.location.href="G8owner-login.html";}})();
