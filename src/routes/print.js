import { Router } from 'express';
import multer from 'multer';
import { printContent, printFile } from '../../services/printService.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const { printerUrl, content, mimeType } = req.body || {};
    if (!printerUrl) {
      return res.status(400).json({ error: 'printerUrl is required' });
    }

    if (req.file) {
      const result = await printFile({
        printerUrl,
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype || mimeType,
      });
      return res.json(result);
    }

    if (typeof content === 'string' && content.length > 0) {
      const result = await printContent({ printerUrl, content, mimeType });
      return res.json(result);
    }

    return res.status(400).json({ error: 'Provide text content or upload a file under field "file"' });
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

export default router;


