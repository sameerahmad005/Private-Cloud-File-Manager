const app = require('../server/dist/index.js').default;
const { initDatabase } = require('../server/dist/database/db.js');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
  return app(req, res);
};
