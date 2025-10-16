document.addEventListener("DOMContentLoaded", () => {
  const addRecordBtn = document.getElementById("addRecordBtn");
  const addRecordForm = document.getElementById("addRecordForm");
  const recordForm = document.getElementById("recordForm");
  const recordTableBody = document.getElementById("recordTableBody");

  // ✅ Match backend port
  const API_URL = "http://localhost:5000/api/records";

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

      recordTableBody.innerHTML = "";
      if (records.length === 0) {
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
    } catch (err) {
      console.error("Error loading records:", err);
      recordTableBody.innerHTML = "<tr><td colspan='8'>Failed to load records.</td></tr>";
    }
  }

  /* -----------------------------
   ➕ Add or Update record
  ----------------------------- */
  let editingId = null;

  recordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientName = document.getElementById("clientName").value.trim();
    const email = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const address = document.getElementById("address").value.trim();
    const serviceAvailed = document.getElementById("serviceAvailed").value.trim();
    const date = document.getElementById("recordDate").value;

    if (!clientName || !email || !contact || !address || !serviceAvailed || !date) {
      alert("Please fill in all fields.");
      return;
    }

    const status = document.getElementById("status").value;
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
        loadRecords();
      } else {
        alert("Failed to save record.");
      }
    } catch (err) {
      console.error("Error saving record:", err);
    }
  });

  /* -----------------------------
   🟣 Toggle form visibility
  ----------------------------- */
  addRecordBtn.addEventListener("click", () => {
    addRecordForm.style.display =
      addRecordForm.style.display === "none" ? "block" : "none";
  });

  /* -----------------------------
   🔍 Search Function
  ----------------------------- */
  document.getElementById("searchInput").addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (query === "") {
      loadRecords();
      return;
    }

    const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
    const records = await res.json();

    recordTableBody.innerHTML = "";
    if (records.length === 0) {
      recordTableBody.innerHTML = "<tr><td colspan='8'>No matching records found.</td></tr>";
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
  });

  /* -----------------------------
   🧮 Filter by Service
  ----------------------------- */
  document.getElementById("filterService").addEventListener("change", async (e) => {
    const selectedService = e.target.value;
    if (selectedService === "") {
      loadRecords();
      return;
    }

    const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(selectedService)}`);
    const records = await res.json();

    recordTableBody.innerHTML = "";
    if (records.length === 0) {
      recordTableBody.innerHTML = "<tr><td colspan='8'>No records found for this service.</td></tr>";
    } else {
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
  });

  /* -----------------------------
   🗑️ Delete & ✏️ Edit actions
  ----------------------------- */
  recordTableBody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;

    if (e.target.classList.contains("delete")) {
      if (confirm("Delete this record?")) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        loadRecords();
      }
    }

    if (e.target.classList.contains("edit")) {
      const row = e.target.closest("tr");
      document.getElementById("clientName").value = row.children[0].textContent;
      document.getElementById("email").value = row.children[1].textContent;
      document.getElementById("contact").value = row.children[2].textContent;
      document.getElementById("address").value = row.children[3].textContent;
      document.getElementById("serviceAvailed").value = row.children[4].textContent;
      document.getElementById("recordDate").value = row.children[5].textContent;
      document.getElementById("status").value = row.children[6].textContent; // prefill dropdown
      editingId = id;
      addRecordForm.style.display = "block";
    }
  });

  /* -----------------------------
   🚀 Initial load
  ----------------------------- */
  loadRecords();
});
