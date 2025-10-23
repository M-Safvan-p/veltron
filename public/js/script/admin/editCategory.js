document.addEventListener("DOMContentLoaded", () => {
  const statusToggle = document.getElementById("statusToggle");
  const statusText = document.getElementById("statusText");
  const isListedInput = document.getElementById("isListed");

  // Toggle functionality
  statusToggle.addEventListener("click", () => {
    const isActive = statusToggle.classList.contains("active");
    const newStatus = !isActive;

    statusToggle.classList.toggle("active", newStatus);
    statusToggle.classList.toggle("inactive", !newStatus);

    statusText.textContent = newStatus ? "Listed" : "Unlisted";
    statusText.classList.toggle("listed", newStatus);
    statusText.classList.toggle("unlisted", !newStatus);

    isListedInput.value = newStatus;
  });

  // Submit form using Axios
  document.getElementById("categoryForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryId = document.getElementById("categoryId").value;
    const categoryName = document.getElementById("categoryName").value.trim();
    const description = document.getElementById("description").value.trim();
    const offer = document.getElementById("offer").value.trim();
    const isListed = document.getElementById("isListed").value;

    try {
      const response = await axios.put(`/admin/category/edit-category/${categoryId}`, {
        name: categoryName,
        description: description,
        offer,
        isListed: isListed,
      });

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Category updated successfully",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          confirmButton: "swal-confirm-black",
        },
      }).then(() => {
        window.location.href = response.data.redirectUrl;
      });
    } catch (error) {
      console.error("Update failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to update category",
        customClass: {
          confirmButton: "swal-confirm-black",
        },
      });
    }
  });
});
