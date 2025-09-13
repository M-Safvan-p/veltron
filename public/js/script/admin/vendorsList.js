document.addEventListener("DOMContentLoaded", function () {
  // Toggle switch functionality
  const toggleSwitches = document.querySelectorAll(".toggle-switch");
  toggleSwitches.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const vendorId = this.dataset.vendorId;
      const isActive = this.classList.contains("active");

      // Toggle the state
      if (isActive) {
        this.classList.remove("active");
        this.classList.add("blocked");
      } else {
        this.classList.remove("blocked");
        this.classList.add("active");
      }

      console.log("Toggling vendor block status:", vendorId);
      // Implement API call to update vendor status
    });
  });

  // View vendor function
  function viewVendor(vendorId) {
    console.log("Viewing vendor:", vendorId);
    // Implement view vendor logic - redirect to vendor details page
    window.location.href = `/admin/vendors/${vendorId}`;
  }



});
