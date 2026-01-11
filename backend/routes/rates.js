import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all rates from XML
router.get('/', async (req, res) => {
  try {
    const xmlPath = path.join(__dirname, '../data/rates.xml');
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const rates = result.rates.rate.map(r => ({
      name: r.name[0],
      value: parseFloat(r.value[0]),
      code: r.code ? r.code[0] : undefined,
      installments: r.installments ? r.installments[0] : undefined,
      isActive: r.isActive[0] === 'true'
    }));
    
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific rate by name
router.get('/:name', async (req, res) => {
  try {
    const xmlPath = path.join(__dirname, '../data/rates.xml');
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const rate = result.rates.rate.find(r => r.name[0] === req.params.name);
    
    if (!rate) {
      return res.status(404).json({ error: 'Rate not found' });
    }
    
    res.json({
      name: rate.name[0],
      value: parseFloat(rate.value[0]),
      code: rate.code ? rate.code[0] : undefined,
      installments: rate.installments ? rate.installments[0] : undefined,
      isActive: rate.isActive[0] === 'true'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
