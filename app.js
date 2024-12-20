const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(cors());
const allowedOrigins = [
  'https://www.ui.paralegal.lk',
  'https://localhost:3000',
  'https://www.dev.paralegal.lk',
  'https://www.paralegal.lk',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use('/payment', paymentRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
