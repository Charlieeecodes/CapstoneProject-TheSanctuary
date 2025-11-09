document.addEventListener("DOMContentLoaded", async () => {
  /* ========================================
     🧩 ELEMENT REFERENCES
  ======================================== */
  const addRecordBtn = document.getElementById("addRecordBtn");
  const addRecordForm = document.getElementById("addRecordForm");
  const recordForm = document.getElementById("recordForm");
  const recordTableBody = document.getElementById("recordTableBody");
  const API_URL = "http://localhost:5000/api/records";
  let editingId = null;

  // Auto-fill cost when service is selected
  const serviceSelect = document.getElementById("serviceAvailed");
  const costInput = document.getElementById("serviceCost");

  if (serviceSelect && costInput) {
    serviceSelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      costInput.value = servicePrices[selected] || "";
    });
  }

  /* ========================================
     🕒 TOPBAR DATE & TIME
  ======================================== */
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

  /* ========================================
     📥 LOAD RECORDS
  ======================================== */
  async function loadRecords() {
    recordTableBody.innerHTML = "<tr><td colspan='8'>Loading...</td></tr>";
    try {
      const res = await fetch(API_URL);
      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Error loading records:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Failed to load records.</td></tr>";
    }
  }

  /* ========================================
     🧾 DISPLAY RECORDS
  ======================================== */
  function displayRecords(records) {
    recordTableBody.innerHTML = "";

    if (!records || records.length === 0) {
      recordTableBody.innerHTML = "<tr><td colspan='8'>No records found.</td></tr>";
      return;
    }

    records.forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${record.client_name}</td>
        <td>${record.email}</td>
        <td>${record.contact}</td>
        <td>${record.address}</td>
        <td>${record.service}</td>
        <td>₱${Number(record.cost || 0).toLocaleString()}</td>
        <td>${record.date ? record.date.split("T")[0] : ""}</td>
        <td>${record.status}</td>
        <td>
          <button class="edit" data-id="${record.id}">Edit</button>
          <button class="delete" data-id="${record.id}">Delete</button>
        </td>
      `;
      recordTableBody.appendChild(row);
    });
  }
  // ========================================
  // 💰 SERVICE PRICES (Standardized)
  // ========================================
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
    "Chapel A (30-50 pax)": 150000,
    "Chapel B (75-100 pax)": 250000,
    "Main Chapel (100-150 pax)": 350000,
  };

  /* ========================================
     ➕ ADD / UPDATE RECORD
  ======================================== */
  recordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientName = document.getElementById("clientName").value.trim();
    const email = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const address = document.getElementById("address").value.trim();
    const serviceAvailed = document.getElementById("serviceAvailed").value.trim();
    const cost = parseFloat(document.getElementById("serviceCost").value) || 0;
    const date = document.getElementById("recordDate").value;
    const status = document.getElementById("status").value;

    if (!clientName || !email || !contact || !address || !serviceAvailed || !date) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = { clientName, email, contact, address, serviceAvailed, cost, date, status };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        editingId = null;
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        recordForm.reset();
        addRecordForm.style.display = "none";
        await loadRecords();
      } else {
        alert("Failed to save record.");
      }
    } catch (err) {
      console.error("❌ Error saving record:", err);
    }
  });

  /* ========================================
     🔍 SEARCH
  ======================================== */
  document.getElementById("searchInput").addEventListener("input", async (e) => {
    const query = e.target.value.trim();

    if (!query) {
      await loadRecords();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Search failed:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Error while searching records.</td></tr>";
    }
  });

  /* ========================================
     🧮 FILTERS
  ======================================== */
  const filters = { service: "", status: "", startDate: "", endDate: "" };
  async function applyFilters() {
    try {
      const queryParams = new URLSearchParams();

      if (filters.service) queryParams.append("service", filters.service);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const res = await fetch(`${API_URL}?${queryParams.toString()}`);
      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Failed to apply filters:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Error filtering records.</td></tr>";
    }
  }

  // Update event listeners
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

  /* ========================================
    🟣 TOGGLE ADD RECORD MODAL
  ======================================== */
  const addRecordModal = document.getElementById("addRecordModal");
  const closeRecordModal = document.getElementById("closeRecordModal");

  addRecordBtn.addEventListener("click", () => {
    addRecordModal.classList.add("show");
  });

  closeRecordModal.addEventListener("click", () => {
    addRecordModal.classList.remove("show");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") addRecordModal.classList.remove("show");
  });

  /* ========================================
     🗑️ DELETE / ✏️ EDIT
  ======================================== */
  recordTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("delete")) {
      if (confirm("Delete this record?")) {
        try {
          const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          if (res.ok) await loadRecords();
          else alert("Failed to delete record.");
        } catch (err) {
          console.error("❌ Error deleting record:", err);
        }
      }
    }
    if (btn.classList.contains("edit")) {
      const row = btn.closest("tr");
      document.getElementById("clientName").value = row.children[0].textContent;
      document.getElementById("email").value = row.children[1].textContent;
      document.getElementById("contact").value = row.children[2].textContent;
      document.getElementById("address").value = row.children[3].textContent;
      document.getElementById("serviceAvailed").value = row.children[4].textContent;
      document.getElementById("serviceCost").value = row.children[5].textContent.replace(/[₱,]/g, "").trim();

      const dateText = row.children[6].textContent.trim();
      document.getElementById("recordDate").value = dateText.includes("T")
        ? dateText.split("T")[0]
        : dateText;

      document.getElementById("status").value = row.children[7].textContent.trim();

      // ✅ Show modal and update title
      const modal = document.getElementById("addRecordModal");
      const modalTitle = document.getElementById("modalTitle");
      modalTitle.textContent = "Edit Record";
      modal.classList.add("show");

      editingId = id;
    }
  });

  /* ========================================
     📤 CSV UPLOAD & PREVIEW
  ======================================== */
  const csvInput = document.getElementById("csvFileInput");
  const previewBtn = document.getElementById("previewCsvBtn");
  const confirmBtn = document.getElementById("confirmUploadBtn");
  const previewTable = document.getElementById("csvPreviewTable");
  const fileNameLabel = document.getElementById("fileNameLabel");
  let parsedData = [];

  csvInput.addEventListener("change", () => {
    fileNameLabel.textContent = csvInput.files.length
      ? csvInput.files[0].name
      : "No file chosen";
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
        headers: { "Content-Type": "application/json" },
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
      await loadRecords(); // reload after upload
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
    popup.textContent = message;
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 3000);
  }
  /* ========================================
    📄 GENERATE SERVICE RECORDS REPORT (Export or Preview)
  ======================================== */
  function generateRecordsPDF(preview = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 🕊️ Logo (left side)
    const logo = new Image();
    logo.src = "../assets/images/logo.png";
    const logoWidth = 35;
    const logoHeight = 10;
    doc.addImage(logo, "PNG", 10, 12, logoWidth, logoHeight);

    // 🏛️ Title ("THE SANCTUARY")
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("THE SANCTUARY", 50, 17);

    // 🗓️ Generation date (right-aligned)
    const dateStr = new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.setFontSize(10);
    doc.text(`Report Created: ${dateStr}`, pageWidth - 10, 15, { align: "right" });

    // 📘 Subtitle ("Service Records Report")
    doc.setFontSize(9);
    doc.text("Service Records Report", 50, 21);

    // 🧠 Filter summary (left-aligned, below subtitle)
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

    let filtersSummary = `Service: ${filterService} | Status: ${filterStatus} | Date: ${dateRangeDisplay}`;
    filtersSummary = filtersSummary.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

    doc.setFontSize(10);
    doc.text(filtersSummary, 9, 28); // left aligned under subtitle

    // 🟢 Divider line (Sanctuary green)
    doc.setDrawColor(27, 150, 90);
    doc.setLineWidth(0.5);
    doc.line(10, 30, pageWidth - 10, 30);


    // 📋 Table data
    const table = document.querySelector(".records-table");
    if (!table) {
      alert("No records table found to export.");
      return;
    }

    // Exclude last column (Actions)
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map(th => th.textContent.trim())
      .slice(0, -1);

    const body = Array.from(table.querySelectorAll("tbody tr")).map(tr => {
      const cells = Array.from(tr.children)
        .slice(0, -1)
        .map(td => td.textContent.trim());

      // 🗓️ Clean up Date (column 6)
      const dateIndex = 6;
      if (cells[dateIndex]) cells[dateIndex] = cells[dateIndex].split("T")[0];

      // 💰 Clean up Cost (column 5)
      const costIndex = 5;
      if (cells[costIndex]) {
        const clean = cells[costIndex].replace(/[₱\s,]/g, "").trim();
        const num = Number(clean);
        cells[costIndex] = num ? `PHP ${num.toLocaleString()}` : "PHP 0";
      }

      return cells;
    });

    // 🧾 Generate table
    doc.autoTable({
      head: [headers],
      body: body,
      startY: 33, // start below header and line
      tableWidth: "auto",
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: "middle",
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      headStyles: {
        fillColor: [27, 150, 90],
        textColor: 255,
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: { minCellHeight: 6 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 8, right: 8 },
    });

    // 💾 Preview or Save
    if (preview) {
      const blobUrl = doc.output("bloburl");
      window.open(blobUrl, "_blank"); // 👁️ Opens in new tab
    } else {
      doc.save(
        `Sanctuary_Service_Records_${new Date().toISOString().split("T")[0]}.pdf`
      );
    }
  }
  /* ========================================
    📄 BUTTON EVENT LISTENERS
  ======================================== */
  document
    .getElementById("exportRecordsBtn")
    .addEventListener("click", () => generateRecordsPDF(false));
  document
    .getElementById("previewRecordsBtn")
    .addEventListener("click", () => generateRecordsPDF(true));
  /* ========================================
     🚀 INITIALIZE PAGE
  ======================================== */
  await loadRecords();
});
