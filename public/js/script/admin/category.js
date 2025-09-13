// Toggle switch functionality
document.querySelectorAll(".toggle-switch").forEach((toggle) => {
  toggle.addEventListener("click", async function () {
    const categoryId = this.getAttribute("data-category-id");
    const isActive = this.classList.contains("active");
    const newStatus = !isActive;

    // Update UI immediately
    this.classList.toggle("active", newStatus);
    this.classList.toggle("inactive", !newStatus);

    const statusBadge = this.closest("tr").querySelector(".status-badge");
    statusBadge.textContent = newStatus ? "Listed" : "Unlisted";
    statusBadge.className = `status-badge ${
      newStatus ? "status-listed" : "status-unlisted"
    }`;

    // Persist to backend
    try {
      await axios.patch(`/admin/category/${categoryId}`, { isListed: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update category status.",
      });

      // Revert UI if error// Toggle switch functionality
      document.querySelectorAll(".toggle-switch").forEach((toggle) => {
        toggle.addEventListener("click", async function () {
          const categoryId = this.getAttribute("data-category-id");
          const isActive = this.classList.contains("active");
          const newStatus = !isActive;

          // UI update
          this.classList.toggle("active", newStatus);
          this.classList.toggle("inactive", !newStatus);

          const statusBadge = this.closest("tr").querySelector(".status-badge");
          statusBadge.textContent = newStatus ? "Listed" : "Unlisted";
          statusBadge.className = `status-badge ${
            newStatus ? "status-listed" : "status-unlisted"
          }`;

          try {
            await axios.patch(`/admin/category/${categoryId}`, { isListed: newStatus});
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Update Failed",
              text: "Could not update category status.",
              customClass: {
                confirmButton: "swal-confirm-black",
              },
            });

            // Revert UI on failure
            this.classList.toggle("active", isActive);
            this.classList.toggle("inactive", !isActive);
            statusBadge.textContent = isActive ? "Listed" : "Unlisted";
            statusBadge.className = `status-badge ${
              isActive ? "status-listed" : "status-unlisted"
            }`;
          }
        });
      });

      // Edit category function
      function editCategory(categoryId) {
        window.location.href = `/admin/category/edit-category/${categoryId}`;
      }

      this.classList.toggle("active", isActive);
      this.classList.toggle("inactive", !isActive);
      statusBadge.textContent = isActive ? "Listed" : "Unlisted";
      statusBadge.className = `status-badge ${
        isActive ? "status-listed" : "status-unlisted"
      }`;
    }
  });
});

// Edit category function
function editCategory(categoryId) {
  window.location.href = `/admin/category/edit-category/${categoryId}`;
}
