import ipp from 'ipp';
import fs from 'fs';
import path from 'path';

function inferMimeType({ filename, buffer, explicitMime }) {
  if (explicitMime) return explicitMime;
  if (filename && filename.toLowerCase().endsWith('.pdf')) return 'application/pdf';
  // Heuristic: PDF files start with %PDF
  if (buffer && buffer.length > 4 && buffer.slice(0, 4).toString('utf8') === '%PDF') {
    return 'application/pdf';
  }
  return 'text/plain; charset=utf-8';
}

export async function printContent({ printerUrl, content, mimeType }) {
  if (!printerUrl) {
    throw new Error('printerUrl is required');
  }
  if (typeof content !== 'string') {
    throw new Error('content must be a string for text printing');
  }
  const buffer = Buffer.from(content, 'utf8');
  const resolvedMime = inferMimeType({ buffer, explicitMime: mimeType });
  return ippPrint({ printerUrl, buffer, mimeType: resolvedMime, jobName: 'Text Print Job' });
}

export async function printFile({ printerUrl, filePath, originalName, mimeType }) {
  if (!printerUrl) {
    throw new Error('printerUrl is required');
  }
  if (!filePath) {
    throw new Error('filePath is required');
  }
  const abs = path.resolve(filePath);
  const buffer = await fs.promises.readFile(abs);
  const resolvedMime = inferMimeType({ filename: originalName || abs, buffer, explicitMime: mimeType });
  return ippPrint({ printerUrl, buffer, mimeType: resolvedMime, jobName: originalName || path.basename(abs) });
}

function ippPrint({ printerUrl, buffer, mimeType, jobName }) {
  return new Promise((resolve, reject) => {
    try {
      const printer = ipp.Printer(printerUrl);
      const msg = {
        'operation-attributes-tag': {
          'requesting-user-name': process.env.USER || 'printease',
          'job-name': jobName || 'Print Job',
          'document-format': mimeType,
        },
        data: buffer,
      };
      printer.execute('Print-Job', msg, (err, res) => {
        if (err) return reject(err);
        if (res && res.statusCode && !String(res.statusCode).toLowerCase().includes('successful')) {
          return reject(new Error(`IPP error: ${res.statusCode}`));
        }
        resolve({ ok: true, status: res?.statusCode || 'successful-ok', response: res });
      });
    } catch (e) {
      reject(e);
    }
  });
}


