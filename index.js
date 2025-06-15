//index.js
import { app } from './app.js';
import logger from './middleware/logger.js';

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});