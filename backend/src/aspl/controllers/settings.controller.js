// src/aspl/controllers/settings.controller.js
const prisma = require('../../config/database');

const ASPL_SETTINGS_KEY = 'aspl';
const DEFAULTS = { visible: false };

// A missing or unparseable row reads as the defaults rather than erroring: the
// key does not exist until an admin toggles the switch for the first time.
async function readAsplSettings() {
  const row = await prisma.appSetting.findUnique({ where: { key: ASPL_SETTINGS_KEY } });
  if (!row) return { ...DEFAULTS };
  try {
    const parsed = JSON.parse(row.value);
    return { ...DEFAULTS, visible: !!parsed.visible };
  } catch {
    console.error('aspl settings: stored value is not valid JSON, falling back to defaults');
    return { ...DEFAULTS };
  }
}

// GET /api/aspl/settings — public. Every visitor needs this to decide whether
// the ASPL link belongs in the navigation.
const getAsplSettings = async (req, res) => {
  try {
    return res.json(await readAsplSettings());
  } catch (err) {
    console.error('getAsplSettings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/aspl/settings — staff only.
const updateAsplSettings = async (req, res) => {
  try {
    const { visible } = req.body;
    if (typeof visible !== 'boolean') {
      return res.status(400).json({ error: '`visible` must be a boolean.' });
    }

    const value = JSON.stringify({ visible });
    await prisma.appSetting.upsert({
      where: { key: ASPL_SETTINGS_KEY },
      update: { value },
      create: { key: ASPL_SETTINGS_KEY, value },
    });

    return res.json({ visible });
  } catch (err) {
    console.error('updateAsplSettings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAsplSettings, updateAsplSettings };
