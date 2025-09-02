import { Router } from 'express';
import { discoverPrinters } from '../../services/printerDiscovery.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const timeoutMs = Number(req.query.timeoutMs || process.env.BONJOUR_TIMEOUT_MS || 3000);
    const printers = await discoverPrinters({ timeoutMs });
    res.json(printers);
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

export default router;


