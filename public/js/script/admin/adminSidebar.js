// Navigation functionality
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    this.classList.add("active");
  });
});

// Account button functionality
document.querySelector(".account-btn:not(.logout-btn)").addEventListener("click", function () {
  alert("Account settings clicked!");
});

// Logout button functionality
document.querySelector(".logout-btn").addEventListener("click", function () {
  if (confirm("Are you sure you want to logout?")) {
    alert("Logging out...");
  }
});
