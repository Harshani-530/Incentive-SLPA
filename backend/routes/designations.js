import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all designations from XML
router.get('/', async (req, res) => {
  try {
    const xmlPath = path.join(__dirname, '../data/designations.xml');
    const xmlData = fs.readFileSync(xmlPath, 'utf8');
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const designations = result.designations.designation.map(d => ({
      id: parseInt(d.id[0]),
      name: d.name[0]
    }));
    
    res.json(designations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
