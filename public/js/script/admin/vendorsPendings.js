// Approve Vendor
async function approveVendor(vendorId, button) {
  const originalText = button.textContent;

  const result = await Swal.fire({
    title: "Approve Vendor?",
    text: "Do you want to approve this vendor?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, approve",
  });

  if (!result.isConfirmed) return;

  button.disabled = true;
  button.textContent = "Approving...";

  try {
    const response = await axios.post(
      "/admin/vendors/vendor-pendings/approve",
      { vendorId }
    );

    await Swal.fire({
      icon: "success",
      title: "Approved!",
      text: response.data.message,
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });

    removeVendorRow(vendorId);
  } catch (error) {
    console.error("Error approving vendor:", error);

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text:
        error.response?.data?.message ||
        "Failed to approve vendor. Please try again.",
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });

    button.disabled = false;
    button.textContent = originalText;
  }
}

// Cancel Vendor
async function cancelVendor(vendorId, button) {
  const originalText = button.textContent;

  const result = await Swal.fire({
    title: "Cancel Vendor?",
    text: "This vendor application will be rejected.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it",
  });

  if (!result.isConfirmed) return;

  button.disabled = true;
  button.textContent = "Canceling...";

  try {
    const response = await axios.post("/admin/vendors/vendor-pendings/cancel", {
      vendorId,
    });

    await Swal.fire({
      icon: "success",
      title: "Canceled!",
      text: response.data.message,
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });

    removeVendorRow(vendorId);
  } catch (error) {
    console.error("Error canceling vendor:", error);

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text:
        error.response?.data?.message ||
        "Failed to cancel vendor. Please try again.",
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });

    button.disabled = false;
    button.textContent = originalText;
  }
}

// Remove row with animation & check empty state
function removeVendorRow(vendorId) {
  const row = document.getElementById(`vendor-row-${vendorId}`);
  if (row) {
    row.style.transition = "opacity 0.3s ease";
    row.style.opacity = "0";
    setTimeout(() => {
      row.remove();
      checkEmptyState();
    }, 300);
  }
}

// Show empty state if no rows remain
function checkEmptyState() {
  const tableBody = document.querySelector(".pending-vendors-table tbody");
  if (!tableBody.querySelector(".table-row")) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>No Pending Vendors</h3>
            <p>All vendor applications have been processed.</p>
          </div>
        </td>
      </tr>
    `;
  }
}

// Attach event listeners after DOM load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-approve").forEach((button) => {
    button.addEventListener("click", () => {
      const vendorId = button.getAttribute("data-vendor-id");
      approveVendor(vendorId, button);
    });
  });

  document.querySelectorAll(".btn-cancel").forEach((button) => {
    button.addEventListener("click", () => {
      const vendorId = button.getAttribute("data-vendor-id");
      cancelVendor(vendorId, button);
    });
  });
});
