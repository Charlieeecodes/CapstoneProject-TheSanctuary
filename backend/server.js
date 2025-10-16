const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const inquiryRoutes = require('./routes/inquiryRoutes');
const recordRoutes = require('./routes/records'); // ✅ NEW

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/records', recordRoutes); // ✅ NEW

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


