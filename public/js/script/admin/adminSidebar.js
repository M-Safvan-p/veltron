// Add interactive functionality
document.addEventListener("DOMContentLoaded", function () {
  // Search functionality
  const searchInput = document.querySelector(".search-box input");
  searchInput.addEventListener("input", function (e) {
    // Implement search logic here
    console.log("Searching for:", e.target.value);
  });

  // Filter dropdowns
  const filterDropdowns = document.querySelectorAll(".filter-dropdown");
  filterDropdowns.forEach((dropdown) => {
    dropdown.addEventListener("change", function (e) {
      // Implement filter logic here
      console.log("Filter changed:", e.target.name, e.target.value);
    });
  });

  // Sort buttons
  const sortButtons = document.querySelectorAll(".sort-btn");
  sortButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      sortButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");
    });
  });

  // Pagination buttons
  const paginationButtons = document.querySelectorAll(".pagination-btn");
  paginationButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (
        !this.innerHTML.includes("fa-chevron") &&
        this.textContent !== "..."
      ) {
        paginationButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
      }
    });
  });

  // Navigation items
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");
    });
  });
});
