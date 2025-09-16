const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on http://localhost:${PORT}`);
});


