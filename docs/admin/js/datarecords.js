function adminAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

document.addEventListener("DOMContentLoaded", async () => {
  const addRecordBtn = document.getElementById("addRecordBtn");
  const recordForm = document.getElementById("recordForm");
  const recordTableBody = document.getElementById("recordTableBody");
  const paginationContainer = document.getElementById("paginationContainer");
  const servicesCostTotal = document.getElementById("servicesCostTotal");

  const viewArchivedBtn = document.getElementById("viewArchivedBtn");
  const viewActiveBtn = document.getElementById("viewActiveBtn");

  const API_URL = "http://localhost:5000/api/records";

  let editingId = null;
  let viewingArchived = false;

  let allRecords = [];
  let currentPage = 1;
  const recordsPerPage = 10;

  const serviceSelect = document.getElementById("serviceAvailed");
  const costInput = document.getElementById("serviceCost");

  const servicePrices = {
    "Unit with perpetual care": 50000,
    "Interment service": 10000,
    "Retrieval of cadaver": 7000,
    "Embalming services": 5000,
    "Casket": 15000,
    "Chapel viewing": 8000,
    "House viewing or outside viewing": 6000,
    "Hearse": 4000,
    "Funeral Mass": 2000,
    "Function area": 3000,
    "Adult cremation": 15000,
    "Child cremation": 10000,
    "Baby cremation": 8000,
    "Fetus cremation": 6000,
    "Bone cremation": 5000,
    "Urns": 3000,
    "Keepsakes": 1200,
  };

  if (serviceSelect && costInput) {
    serviceSelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      costInput.value = servicePrices[selected] || "";
    });
  }

  function updateDateTime() {
    const now = new Date();

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const el = document.getElementById("currentDateTime");
    if (el) el.textContent = now.toLocaleString("en-US", options);
  }

  setInterval(updateDateTime, 1000);
  updateDateTime();

  function updateServicesCostTotal() {
    if (!servicesCostTotal) return;

    const total = allRecords.reduce((sum, record) => {
      return sum + (Number(record.cost) || 0);
    }, 0);

    servicesCostTotal.textContent = `₱${total.toLocaleString()}`;
  }

  async function loadRecords() {
    viewingArchived = false;
    recordTableBody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    try {
      const res = await fetch(API_URL, {
        headers: { ...adminAuthHeaders() },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ loadRecords failed:", res.status, text);
        recordTableBody.innerHTML = `<tr><td colspan='10'>Failed to load records (${res.status}).</td></tr>`;
        return;
      }

      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Error loading records:", err);
      recordTableBody.innerHTML = "<tr><td colspan='10'>Failed to load records.</td></tr>";
    }
  }

  async function loadArchivedRecords() {
    viewingArchived = true;
    recordTableBody.innerHTML = "<tr><td colspan='10'>Loading archived...</td></tr>";

    try {
      const res = await fetch(`${API_URL}/archived`, {
        headers: { ...adminAuthHeaders() },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ loadArchivedRecords failed:", res.status, text);
        recordTableBody.innerHTML = `<tr><td colspan='10'>Failed to load archived (${res.status}).</td></tr>`;
        return;
      }

      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Error loading archived records:", err);
      recordTableBody.innerHTML = "<tr><td colspan='10'>Failed to load archived records.</td></tr>";
    }
  }

  function displayRecords(records) {
    allRecords = Array.isArray(records) ? records : [];
    currentPage = 1;
    renderPaginatedRecords();
  }

  function renderPaginatedRecords() {
    recordTableBody.innerHTML = "";
    updateServicesCostTotal();

    if (!allRecords || allRecords.length === 0) {
      recordTableBody.innerHTML = "<tr><td colspan='10'>No records found.</td></tr>";
      renderPagination();
      return;
    }

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageRecords = allRecords.slice(startIndex, endIndex);

    pageRecords.forEach((record) => {
      const status = record.status || "";

      const managementInCharge =
        record.management_in_charge ||
        record.managementInCharge ||
        record.management ||
        "N/A";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${record.client_name || ""}</td>
        <td>${record.email || ""}</td>
        <td>${record.contact || ""}</td>
        <td>${record.address || ""}</td>
        <td>${record.service || ""}</td>
        <td>₱${Number(record.cost || 0).toLocaleString()}</td>
        <td>${managementInCharge}</td>
        <td>${record.date ? record.date.split("T")[0] : ""}</td>
        <td>${status}</td>
        <td>
          ${
            viewingArchived
              ? `<button class="restore" data-id="${record.id}">Restore</button>`
              : `<button class="edit" data-id="${record.id}">Edit</button>
                 <button class="archive" data-id="${record.id}" data-status="${status}">Archive</button>`
          }
        </td>
      `;

      recordTableBody.appendChild(row);
    });

    renderPagination();
  }

function renderPagination() {
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(allRecords.length / recordsPerPage);

  if (totalPages <= 1) return;

  const maxVisiblePages = 5;

  const createButton = (text, disabled, onClick, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.disabled = disabled;

    if (active) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", onClick);
    paginationContainer.appendChild(btn);
  };

  // First page button
  createButton("«", currentPage === 1, () => {
    currentPage = 1;
    renderPaginatedRecords();
  });

  // Previous page button
  createButton("‹", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginatedRecords();
    }
  });

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    createButton("1", false, () => {
      currentPage = 1;
      renderPaginatedRecords();
    });

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.className = "pagination-dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    createButton(
      i,
      false,
      () => {
        currentPage = i;
        renderPaginatedRecords();
      },
      i === currentPage
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.className = "pagination-dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }

    createButton(totalPages, false, () => {
      currentPage = totalPages;
      renderPaginatedRecords();
    });
  }

  // Next page button
  createButton("›", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPaginatedRecords();
    }
  });

  // Last page button
  createButton("»", currentPage === totalPages, () => {
    currentPage = totalPages;
    renderPaginatedRecords();
  });
}

  recordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientName = document.getElementById("clientName").value.trim();
    const email = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const address = document.getElementById("address").value.trim();
    const serviceAvailed = document.getElementById("serviceAvailed").value.trim();
    const cost = parseFloat(document.getElementById("serviceCost").value) || 0;
    const managementInCharge = document.getElementById("managementInCharge").value.trim();
    const date = document.getElementById("recordDate").value;
    const status = document.getElementById("status").value;

    if (
      !clientName ||
      !email ||
      !contact ||
      !address ||
      !serviceAvailed ||
      !date
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      clientName,
      email,
      contact,
      address,
      serviceAvailed,
      cost,
      managementInCharge: managementInCharge || "N/A",
      date,
      status,
    };

    try {
      let res;
      const isEdit = !!editingId;

      if (isEdit) {
        res = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...adminAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });

        editingId = null;
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...adminAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        recordForm.reset();

        if (viewingArchived) {
          await loadArchivedRecords();
        } else {
          await loadRecords();
        }

        const modal = document.getElementById("addRecordModal");
        if (modal) modal.classList.remove("show");

        const modalTitle = document.getElementById("modalTitle");
        if (modalTitle) modalTitle.textContent = "Add New Record";

        showUploadNotification(
          isEdit ? "✅ Record updated successfully!" : "✅ New record added!"
        );
      } else {
        const text = await res.text();
        console.error("❌ Save failed:", res.status, text);
        alert("Failed to save record.");
      }
    } catch (err) {
      console.error("❌ Error saving record:", err);
      alert("Something went wrong while saving the record.");
    }
  });

  document.getElementById("searchInput").addEventListener("input", async (e) => {
    const query = e.target.value.trim().toLowerCase();

    if (!query) {
      if (viewingArchived) {
        await loadArchivedRecords();
      } else {
        await loadRecords();
      }

      return;
    }

    if (viewingArchived) {
      const filtered = allRecords.filter((record) => {
        const values = [
          record.client_name,
          record.email,
          record.contact,
          record.address,
          record.service,
          record.management_in_charge,
          record.status,
        ];

        return values.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      });

      displayRecords(filtered);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
        headers: { ...adminAuthHeaders() },
      });

      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Search failed:", err);
      recordTableBody.innerHTML = "<tr><td colspan='10'>Error while searching records.</td></tr>";
    }
  });

  const filters = {
    service: "",
    status: "",
    startDate: "",
    endDate: "",
  };

  async function applyFilters() {
    try {
      if (viewingArchived) {
        await loadArchivedRecords();
        return;
      }

      const queryParams = new URLSearchParams();

      if (filters.service) queryParams.append("service", filters.service);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const res = await fetch(`${API_URL}?${queryParams.toString()}`, {
        headers: { ...adminAuthHeaders() },
      });

      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Failed to apply filters:", err);
      recordTableBody.innerHTML = "<tr><td colspan='10'>Error filtering records.</td></tr>";
    }
  }

  document.getElementById("filterService").addEventListener("change", (e) => {
    filters.service = e.target.value;
    applyFilters();
  });

  document.getElementById("filterStatus").addEventListener("change", (e) => {
    filters.status = e.target.value;
    applyFilters();
  });

  document.getElementById("filterStartDate").addEventListener("change", (e) => {
    filters.startDate = e.target.value;
    applyFilters();
  });

  document.getElementById("filterEndDate").addEventListener("change", (e) => {
    filters.endDate = e.target.value;
    applyFilters();
  });

  const addRecordModal = document.getElementById("addRecordModal");
  const closeRecordModal = document.getElementById("closeRecordModal");

  addRecordBtn.addEventListener("click", () => {
    editingId = null;
    recordForm.reset();

    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.textContent = "Add New Record";

    addRecordModal.classList.add("show");
  });

  closeRecordModal.addEventListener("click", () => {
    addRecordModal.classList.remove("show");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") addRecordModal.classList.remove("show");
  });

  recordTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("archive")) {
      const status = (btn.dataset.status || "").trim().toLowerCase();

      if (status === "pending" || status === "ongoing" || status === "on going") {
        showUploadNotification("⚠️ Pending or ongoing records cannot be archived.");
        return;
      }

      if (confirm("Archive this record?")) {
        try {
          const res = await fetch(`${API_URL}/${id}/archive`, {
            method: "PUT",
            headers: {
              ...adminAuthHeaders(),
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            await loadRecords();
            showUploadNotification("📦 Record archived successfully!");
          } else {
            const result = await res.json().catch(() => null);
            alert(result?.message || "Failed to archive record.");
          }
        } catch (err) {
          console.error("❌ Error archiving record:", err);
          alert("Something went wrong while archiving.");
        }
      }
    }

    if (btn.classList.contains("edit")) {
      const row = btn.closest("tr");

      document.getElementById("clientName").value = row.children[0].textContent.trim();
      document.getElementById("email").value = row.children[1].textContent.trim();
      document.getElementById("contact").value = row.children[2].textContent.trim();
      document.getElementById("address").value = row.children[3].textContent.trim();
      document.getElementById("serviceAvailed").value = row.children[4].textContent.trim();

      document.getElementById("serviceCost").value = row.children[5].textContent
        .replace(/[₱,]/g, "")
        .trim();

      document.getElementById("managementInCharge").value =
        row.children[6].textContent.trim() || "N/A";

      const dateText = row.children[7].textContent.trim();

      document.getElementById("recordDate").value = dateText.includes("T")
        ? dateText.split("T")[0]
        : dateText;

      document.getElementById("status").value = row.children[8].textContent.trim();

      const modal = document.getElementById("addRecordModal");
      const modalTitle = document.getElementById("modalTitle");

      modalTitle.textContent = "Edit Record";
      modal.classList.add("show");

      editingId = id;
    }

    if (btn.classList.contains("restore")) {
      if (confirm("Restore this record back to active?")) {
        try {
          const res = await fetch(`${API_URL}/${id}/restore`, {
            method: "PUT",
            headers: { ...adminAuthHeaders() },
          });

          if (res.ok) {
            await loadArchivedRecords();
            showUploadNotification("♻️ Record restored!");
          } else {
            const text = await res.text();
            console.error("❌ Restore failed:", res.status, text);
            alert("Failed to restore record.");
          }
        } catch (err) {
          console.error("❌ Error restoring record:", err);
          alert("Something went wrong while restoring.");
        }
      }
    }
  });

  const csvInput = document.getElementById("csvFileInput");
  const previewBtn = document.getElementById("previewCsvBtn");
  const confirmBtn = document.getElementById("confirmUploadBtn");
  const previewTable = document.getElementById("csvPreviewTable");
  const fileNameLabel = document.getElementById("fileNameLabel");

  let parsedData = [];

  csvInput.addEventListener("change", () => {
    if (fileNameLabel) {
      fileNameLabel.textContent = csvInput.files.length
        ? csvInput.files[0].name
        : "No file chosen";
    }
  });

  previewBtn.addEventListener("click", () => {
    const file = csvInput.files[0];

    if (!file) {
      alert("Please select a CSV file first!");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;

        if (!data || data.length === 0) {
          alert("CSV file is empty.");
          return;
        }

        const previewColumns = Object.keys(data[0]).filter(
          (h) => h.toLowerCase() !== "id"
        );

        document.getElementById("csvPreviewContainer").style.display = "block";

        previewTable.querySelector("thead").innerHTML =
          "<tr>" + previewColumns.map((h) => `<th>${h}</th>`).join("") + "</tr>";

        previewTable.querySelector("tbody").innerHTML = data
          .map((row) => {
            const filtered = previewColumns
              .map((h) => `<td>${row[h] || ""}</td>`)
              .join("");

            return `<tr>${filtered}</tr>`;
          })
          .join("");

        parsedData = data.map((row) => ({
          client_name: row.client_name?.trim() || null,
          email: row.email?.trim() || null,
          contact: row.contact?.trim() || null,
          address: row.address?.trim() || null,
          service: row.service?.trim() || null,
          cost: parseFloat(row.cost) || 0,
          management_in_charge:
            row.management_in_charge?.trim() ||
            row.managementInCharge?.trim() ||
            row.management?.trim() ||
            "N/A",
          date: row.date?.trim() || null,
          status: row.status?.trim() || "Pending",
        }));

        confirmBtn.style.display = "inline-block";
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        alert("Failed to parse CSV file. Please check the format.");
      },
    });
  });

  confirmBtn.addEventListener("click", async () => {
    if (parsedData.length === 0) {
      alert("No data to upload!");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Uploading...";

    try {
      const res = await fetch(`${API_URL}/upload-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminAuthHeaders(),
        },
        body: JSON.stringify({ records: parsedData }),
      });

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }

      showUploadNotification(result.message || "✅ Upload complete!");
      confirmBtn.style.display = "none";

      if (viewingArchived) {
        await loadArchivedRecords();
      } else {
        await loadRecords();
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("❌ " + err.message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Upload";
    }
  });

  function showUploadNotification(message) {
    const popup = document.getElementById("uploadNotification");
    if (!popup) return;

    popup.textContent = message;
    popup.classList.add("show");

    setTimeout(() => popup.classList.remove("show"), 3000);
  }

  function generateRecordsPDF(preview = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = "../assets/images/logo.png";

    try {
      doc.addImage(logo, "PNG", 10, 12, 35, 10);
    } catch (err) {
      console.warn("Logo could not be added to PDF:", err);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("THE SANCTUARY", 50, 17);

    const dateStr = new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    doc.setFontSize(10);
    doc.text(`Report Created: ${dateStr}`, pageWidth - 10, 15, { align: "right" });

    doc.setFontSize(9);
    doc.text("Service Records Report", 50, 21);

    const filterService = document.getElementById("filterService")?.value || "All";
    const filterStatus = document.getElementById("filterStatus")?.value || "All";
    const filterStartDate = document.getElementById("filterStartDate")?.value || "";
    const filterEndDate = document.getElementById("filterEndDate")?.value || "";

    let dateRangeDisplay = "All";

    if (filterStartDate && filterEndDate) {
      dateRangeDisplay = `${filterStartDate} to ${filterEndDate}`;
    } else if (filterStartDate) {
      dateRangeDisplay = `From ${filterStartDate}`;
    } else if (filterEndDate) {
      dateRangeDisplay = `Until ${filterEndDate}`;
    }

    const totalCost = allRecords.reduce((sum, record) => {
      return sum + (Number(record.cost) || 0);
    }, 0);

    const filtersSummary = `Service: ${filterService || "All"} | Status: ${
      filterStatus || "All"
    } | Date: ${dateRangeDisplay} | Total Cost: PHP ${totalCost.toLocaleString()}`;

    doc.setFontSize(10);
    doc.text(filtersSummary, 9, 28);

    doc.setDrawColor(27, 150, 90);
    doc.setLineWidth(0.5);
    doc.line(10, 30, pageWidth - 10, 30);

    const headers = [
      "Client Name",
      "Email",
      "Contact",
      "Address",
      "Service Availed",
      "Service Cost",
      "Management in Charge",
      "Date",
      "Status",
    ];

    const body = allRecords.map((record) => {
      const managementInCharge =
        record.management_in_charge ||
        record.managementInCharge ||
        record.management ||
        "N/A";

      return [
        record.client_name || "",
        record.email || "",
        record.contact || "",
        record.address || "",
        record.service || "",
        `PHP ${Number(record.cost || 0).toLocaleString()}`,
        managementInCharge,
        record.date ? record.date.split("T")[0] : "",
        record.status || "",
      ];
    });

    doc.autoTable({
      head: [headers],
      body,
      startY: 33,
      tableWidth: "auto",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [27, 150, 90],
        textColor: 255,
        fontSize: 8.5,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 35 },
        2: { cellWidth: 24 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 35 },
        7: { cellWidth: 24 },
        8: { cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 8, right: 8 },
    });

    if (preview) {
      const blobUrl = doc.output("bloburl");
      window.open(blobUrl, "_blank");
    } else {
      doc.save(
        `Sanctuary_Service_Records_${new Date().toISOString().split("T")[0]}.pdf`
      );
    }
  }

  document
    .getElementById("exportRecordsBtn")
    .addEventListener("click", () => generateRecordsPDF(false));

  document
    .getElementById("previewRecordsBtn")
    .addEventListener("click", () => generateRecordsPDF(true));

  if (viewArchivedBtn && viewActiveBtn) {
    viewArchivedBtn.addEventListener("click", async () => {
      viewingArchived = true;
      viewArchivedBtn.style.display = "none";
      viewActiveBtn.style.display = "inline-block";
      await loadArchivedRecords();
    });

    viewActiveBtn.addEventListener("click", async () => {
      viewingArchived = false;
      viewActiveBtn.style.display = "none";
      viewArchivedBtn.style.display = "inline-block";
      await loadRecords();
    });
  }

  await loadRecords();
});