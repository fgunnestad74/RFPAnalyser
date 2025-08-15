import XLSX from 'xlsx';
import fs from 'fs-extra';
import path from 'path';

export async function parse(filePath) {
  try {
    console.log(`Parsing Excel file: ${filePath}`);
    
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath, { 
      type: 'file',
      cellDates: true,
      cellText: false
    });
    
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      throw new Error('No sheets found in Excel file');
    }
    
    let combinedContent = '';
    const sheetsData = {};
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Skip empty sheets
      if (!worksheet || Object.keys(worksheet).length <= 1) {
        console.log(`Skipping empty sheet: ${sheetName}`);
        continue;
      }
      
      // Convert to CSV format for text analysis
      const csvData = XLSX.utils.sheet_to_csv(worksheet, { 
        strip: true,
        blankrows: false
      });
      
      // Also get JSON format for structured data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });
      
      // Filter out completely empty rows
      const nonEmptyRows = jsonData.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      
      sheetsData[sheetName] = {
        csv: csvData,
        json: nonEmptyRows,
        rowCount: nonEmptyRows.length,
        colCount: nonEmptyRows.length > 0 ? Math.max(...nonEmptyRows.map(row => row.length)) : 0
      };
      
      // Add to combined content if sheet has data
      if (csvData.trim()) {
        combinedContent += `\n\n=== Sheet: ${sheetName} ===\n`;
        combinedContent += csvData.trim();
      }
    }
    
    // Create a summary of the Excel file structure
    const validSheets = Object.keys(sheetsData).filter(name => sheetsData[name].rowCount > 0);
    
    if (validSheets.length === 0) {
      throw new Error('Excel file contains no readable data');
    }
    
    const summary = `Excel File Analysis:
Total Sheets: ${sheetNames.length}
Sheets with Data: ${validSheets.length}
Sheet Names: ${validSheets.join(', ')}

Sheet Summary:
${validSheets.map(name => {
  const sheet = sheetsData[name];
  return `• ${name}: ${sheet.rowCount} rows, ${sheet.colCount} columns`;
}).join('\n')}

Content:${combinedContent}
    `.trim();
    
    console.log(`Successfully parsed Excel file. Found ${validSheets.length} sheets with data. Total content length: ${summary.length} characters`);
    return summary;

  } catch (error) {
    console.error('Excel parsing error:', error);
    
    // Try to provide more specific error information
    if (error.message.includes('ENOENT')) {
      throw new Error(`Excel file not found: ${path.basename(filePath)}`);
    } else if (error.message.includes('EACCES')) {
      throw new Error(`Permission denied accessing Excel file: ${path.basename(filePath)}`);
    } else if (error.message.includes('Unsupported file')) {
      throw new Error(`Unsupported Excel file format: ${path.basename(filePath)}`);
    } else {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }
}

export async function parseStructured(filePath) {
  try {
    console.log(`Parsing Excel file (structured): ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const result = {
      sheetNames: workbook.SheetNames,
      sheets: {}
    };
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get data as array of objects (first row as headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Also get raw data as 2D array
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' 
      });
      
      result.sheets[sheetName] = {
        data: jsonData,
        raw: rawData,
        rowCount: rawData.length,
        colCount: rawData.length > 0 ? Math.max(...rawData.map(row => row.length)) : 0
      };
    }
    
    return result;

  } catch (error) {
    console.error('Excel structured parsing error:', error);
    throw new Error(`Failed to parse Excel file (structured): ${error.message}`);
  }
}

export async function extractMetadata(filePath) {
  try {
    const fileStats = await fs.stat(filePath);
    const workbook = XLSX.readFile(filePath, { bookProps: true });
    
    return {
      type: 'excel',
      size: fileStats.size,
      created: fileStats.birthtime,
      modified: fileStats.mtime,
      extension: path.extname(filePath).toLowerCase(),
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
      properties: workbook.Props || {}
    };
  } catch (error) {
    console.error('Excel metadata extraction error:', error);
    throw new Error(`Failed to extract Excel metadata: ${error.message}`);
  }
}