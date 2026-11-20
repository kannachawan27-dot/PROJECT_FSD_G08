'use strict';
const form = document.getElementById("adminLoginForm");
const message = document.getElementById("loginMessage");
form?.addEventListener("submit", async event => {
  event.preventDefault();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  message.textContent = "Signing in...";
  try {
    const response = await fetch("/api/login", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body:JSON.stringify({username,password}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Login failed.");
    window.location.href = "G8owner.html";
  } catch (error) {
    message.textContent = error.message || "Unable to sign in. Start the G8 Bakery server and try again.";
    button.disabled = false;
  }
});
