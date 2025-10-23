// Status toggle functionality
const statusToggle = document.getElementById("statusToggle");
const statusText = document.getElementById("statusText");
const isListedInput = document.getElementById("isListed");

statusToggle.addEventListener("click", () => {
  const isActive = statusToggle.classList.contains("active");

  if (isActive) {
    statusToggle.classList.remove("active");
    statusText.textContent = "Unlisted";
    statusText.className = "toggle-text unlisted";
    isListedInput.value = "false";
  } else {
    statusToggle.classList.add("active");
    statusText.textContent = "Listed";
    statusText.className = "toggle-text listed";
    isListedInput.value = "true";
  }
});

// Form submission handling
document.getElementById("categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("categoryName").value.trim();
  const description = document.getElementById("description").value.trim();
  const offer = document.getElementById("offer").value.trim();
  const isListed = document.getElementById("isListed").value;

  try {
    const response = await axios.post("/admin/category/add-category", {
      name,
      description,
      offer,
      isListed,
    });

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Category added successfully.",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    }).then(() => {
      window.location.href = response.data.redirectUrl;
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.response?.data?.message || "Something went wrong!",
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });
  }
});
