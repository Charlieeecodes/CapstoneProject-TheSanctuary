// fetchInquiries.js
async function fetchInquiries() {
  try {
    const res = await fetch('http://localhost:5000/api/inquiries');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    return [];
  }
}
