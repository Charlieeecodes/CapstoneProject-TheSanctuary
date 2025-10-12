const dotenv = require('dotenv');

// Load environment variables as early as possible so other modules can use them
dotenv.config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const inquiryRoutes = require('./routes/inquiryRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api/inquiries', inquiryRoutes);
app.use(express.urlencoded({ extended: true })); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
