import { app } from './app.js';
import logger from './middleware/logger.js';

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});