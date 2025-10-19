const feedbackForm = document.getElementById('feedbackForm');

feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect ratings
  const overall_rating = parseInt(document.querySelector('input[name="overall"]:checked')?.value) || 0;
  const service_rating = parseInt(document.querySelector('input[name="service"]:checked')?.value) || 0;
  const satisfaction_rating = parseInt(document.querySelector('input[name="satisfaction"]:checked')?.value) || 0;
  const professionalism_rating = parseInt(document.querySelector('input[name="professionalism"]:checked')?.value) || 0;
  const communication_rating = parseInt(document.querySelector('input[name="communication"]:checked')?.value) || 0;
  const facility_rating = parseInt(document.querySelector('input[name="facility"]:checked')?.value) || 0;

  const feedbackData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
    overall_rating,
    service_rating,
    satisfaction_rating,
    professionalism_rating,
    communication_rating,
    facility_rating
  };

  try {
    const res = await fetch('http://localhost:5000/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    if (res.ok) {
      alert("✅ Thank you for your feedback!");
      feedbackForm.reset();
    } else {
      alert("❌ Failed to submit feedback.");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error submitting feedback.");
  }
});
