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
        <td>${record.date}</td>
        <td>${record.status}</td>
        <td>
          <button class="edit" data-id="${record.id}">Edit</button>
          <button class="delete" data-id="${record.id}">Delete</button>
        </td>
      `;
      recordTableBody.appendChild(row);
    });
  }

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
    const date = document.getElementById("recordDate").value;
    const status = document.getElementById("status").value;

    if (!clientName || !email || !contact || !address || !serviceAvailed || !date) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = { clientName, email, contact, address, serviceAvailed, date, status };

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
  const filters = { service: "", status: "", date: "" };

  async function applyFilters() {
    try {
      const queryParams = new URLSearchParams();
      if (filters.service) queryParams.append("service", filters.service);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.date) queryParams.append("date", filters.date);

      console.log("🔎 Applying filters:", `${API_URL}?${queryParams.toString()}`);

      const res = await fetch(`${API_URL}?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const records = await res.json();
      displayRecords(records);
    } catch (err) {
      console.error("❌ Failed to apply filters:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Error while filtering records.</td></tr>";
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

  document.getElementById("filterDate").addEventListener("change", (e) => {
    filters.date = e.target.value;
    applyFilters();
  });

  /* ========================================
     🟣 TOGGLE ADD FORM
  ======================================== */
  addRecordBtn.addEventListener("click", () => {
    addRecordForm.style.display =
      addRecordForm.style.display === "none" ? "block" : "none";
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
      document.getElementById("recordDate").value = row.children[5].textContent;
      document.getElementById("status").value = row.children[6].textContent;
      editingId = id;
      addRecordForm.style.display = "block";
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
     🚀 INITIALIZE PAGE
  ======================================== */
  await loadRecords();
});
