document.addEventListener("DOMContentLoaded", async () => {
  const addRecordBtn = document.getElementById("addRecordBtn");
  const addRecordForm = document.getElementById("addRecordForm");
  const recordForm = document.getElementById("recordForm");
  const recordTableBody = document.getElementById("recordTableBody");

  const API_URL = "http://localhost:5000/api/records";
  let editingId = null;

  /* -----------------------------
   🕒 Update topbar date and time
  ----------------------------- */
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

  /* -----------------------------
   🔄 Load all records from backend
  ----------------------------- */
  async function loadRecords() {
    recordTableBody.innerHTML = "<tr><td colspan='8'>Loading...</td></tr>";
    try {
      const res = await fetch(API_URL);
      const records = await res.json();

      if (!records || records.length === 0) {
        recordTableBody.innerHTML = "<tr><td colspan='8'>No records found.</td></tr>";
        return;
      }

      recordTableBody.innerHTML = records
        .map(
          (record) => `
          <tr>
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
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error("Error loading records:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Failed to load records.</td></tr>";
    }
  }

  /* -----------------------------
   ➕ Add or Update record
  ----------------------------- */
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
      console.error("Error saving record:", err);
    }
  });
  /* -----------------------------
 🔍 Search Function (Fixed)
----------------------------- */
document.getElementById("searchInput").addEventListener("input", async (e) => {
  const query = e.target.value.trim();

  if (!query) {
    await loadRecords(); // reload all if empty
    return;
  }

  try {
    const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
    const records = await res.json();

    displayRecords(records);
  } catch (err) {
    console.error("Search failed:", err);
    recordTableBody.innerHTML = "<tr><td colspan='8'>Error while searching records.</td></tr>";
  }
});

  /* -----------------------------
  🧮 Filter by Service (Fixed)
  ----------------------------- */
  document.getElementById("filterService").addEventListener("change", async (e) => {
    const selectedService = e.target.value;

    if (!selectedService) {
      await loadRecords(); // reload all if no filter
      return;
    }

    try {
      const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(selectedService)}`);
      const records = await res.json();

      displayRecords(records);
    } catch (err) {
      console.error("Filter failed:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Error while filtering records.</td></tr>";
    }
  });
  /* -----------------------------
🧩 Filter by Status
----------------------------- */
document.getElementById("filterStatus").addEventListener("change", async (e) => {
  const selectedStatus = e.target.value;

  if (!selectedStatus) {
    await loadRecords(); // reload all if no filter
    return;
  }

  try {
    const res = await fetch(`${API_URL}/filterByStatus?status=${encodeURIComponent(selectedStatus)}`);
    const records = await res.json();
    displayRecords(records);
  } catch (err) {
    console.error("Filter by status failed:", err);
    recordTableBody.innerHTML = "<tr><td colspan='8'>Error while filtering by status.</td></tr>";
  }
});

    /* -----------------------------
  📅 Filter by Date (Fixed)
  ----------------------------- */
  document.getElementById("filterDate").addEventListener("change", async (e) => {
    const selectedDate = e.target.value;

    if (!selectedDate) {
      await loadRecords(); // reload all if cleared
      return;
    }

    try {
      // Backend expects "YYYY-MM-DD" format, which is what input[type=date] gives.
      const res = await fetch(`${API_URL}/filterByDate?date=${encodeURIComponent(selectedDate)}`);
      const records = await res.json();

      displayRecords(records);
    } catch (err) {
      console.error("Filter by date failed:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Error while filtering by date.</td></tr>";
    }
  });
  
  /* -----------------------------
  🧩 Helper: Display Records
  ----------------------------- */
  function displayRecords(records) {
    recordTableBody.innerHTML = "";

    if (!records || records.length === 0) {
      recordTableBody.innerHTML = "<tr><td colspan='8'>No records found.</td></tr>";
      return;
    }

    records.forEach(record => {
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


  /* -----------------------------
   🟣 Toggle form visibility
  ----------------------------- */
  addRecordBtn.addEventListener("click", () => {
    addRecordForm.style.display =
      addRecordForm.style.display === "none" ? "block" : "none";
  });

  /* -----------------------------
   🗑️ Delete & ✏️ Edit actions (fixed)
  ----------------------------- */
  recordTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return; // Prevent table row clicks
    e.stopPropagation();

    const id = btn.dataset.id;
    if (!id) return;

    // 🗑️ DELETE
    if (btn.classList.contains("delete")) {
      if (confirm("Delete this record?")) {
        try {
          const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          if (res.ok) {
            await loadRecords();
          } else {
            alert("Failed to delete record.");
          }
        } catch (err) {
          console.error("Error deleting record:", err);
        }
      }
    }

    // ✏️ EDIT
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

  /* -----------------------------
   🚀 Initial load (safe)
  ----------------------------- */
  async function init() {
    await loadRecords();
  }

  init();
});

document.addEventListener("DOMContentLoaded", () => {
  const csvInput = document.getElementById("csvFileInput");
  const previewBtn = document.getElementById("previewCsvBtn");
  const confirmBtn = document.getElementById("confirmUploadBtn");
  const previewTable = document.getElementById("csvPreviewTable");
  const previewContainer = document.getElementById("csvPreviewContainer");

  let parsedData = [];

  // 🟣 Step 1: Preview CSV
  previewBtn.addEventListener("click", () => {
    const file = csvInput.files[0];
    if (!file) {
      alert("Please select a CSV file first!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split("\n").map(row => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(r => r.join("").trim() !== "");

      // Build table preview
      previewTable.querySelector("thead").innerHTML = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
      previewTable.querySelector("tbody").innerHTML = dataRows.map(r => "<tr>" + r.map(c => `<td>${c}</td>`).join("") + "</tr>").join("");

      // Store parsed data for later upload
      parsedData = dataRows.map(r => {
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = r[i]?.trim());
        return obj;
      });

      confirmBtn.style.display = "inline-block";
    };
    reader.readAsText(file);
  });

  // 🟢 Step 2: Confirm Upload to Backend
  confirmBtn.addEventListener("click", async () => {
    if (parsedData.length === 0) {
      alert("No data to upload!");
      return;
    }

    try {
      const res = await fetch("/api/records/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsedData }),
      });

      const result = await res.json();
      alert(result.message || "Upload complete!");
      confirmBtn.style.display = "none";
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload CSV data.");
    }
  });
});

