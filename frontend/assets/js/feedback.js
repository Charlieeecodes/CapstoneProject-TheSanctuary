const feedbackForm = document.getElementById('feedbackForm');
const responseMessage = document.getElementById('responseMessage');

feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const overall_rating = parseInt(document.querySelector('input[name="overall"]:checked')?.value) || 0;
  const service_rating = parseInt(document.querySelector('input[name="service"]:checked')?.value) || 0;
  const satisfaction_rating = parseInt(document.querySelector('input[name="satisfaction"]:checked')?.value) || 0;

  const feedbackData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
    overall_rating,
    service_rating,
    satisfaction_rating
  };

  try {
    const res = await fetch('http://localhost:5000/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    if (res.ok) {
      responseMessage.textContent = "✅ Thank you for your feedback!";
      feedbackForm.reset();
    } else {
      responseMessage.textContent = "❌ Failed to submit feedback.";
    }
  } catch (err) {
    console.error(err);
    responseMessage.textContent = "❌ Error submitting feedback.";
  }
});
