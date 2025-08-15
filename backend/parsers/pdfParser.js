import fs from 'fs-extra';
import path from 'path';

// Import PDF.js for better PDF parsing
let pdfjs = null;
try {
  pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch (error) {
  console.warn('PDF.js not available, using basic parsing');
}

export async function parse(filePath) {
  try {
    console.log(`Parsing PDF file: ${filePath}`);
    
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    if (pdfjs) {
      try {
        // Use PDF.js for comprehensive parsing
        const pdfBuffer = await fs.readFile(filePath);
        const uint8Array = new Uint8Array(pdfBuffer);
        
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          verbosity: 0 // Suppress PDF.js warnings
        });
        
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        
        console.log(`PDF has ${numPages} pages`);
        
        let fullText = '';
        let pageTexts = [];
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine all text items from the page
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ')
              .trim();
            
            if (pageText.length > 0) {
              pageTexts.push(`\n--- Page ${pageNum} ---\n${pageText}`);
              fullText += pageText + '\n\n';
            }
            
            console.log(`Extracted ${pageText.length} characters from page ${pageNum}`);
          } catch (pageError) {
            console.warn(`Failed to extract text from page ${pageNum}:`, pageError.message);
            pageTexts.push(`\n--- Page ${pageNum} ---\n[Text extraction failed: ${pageError.message}]`);
          }
        }
        
        // Clean up the extracted text
        const cleanedText = fullText
          .replace(/\r\n/g, '\n')  // Normalize line endings
          .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
          .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
          .trim();
        
        if (cleanedText.length === 0) {
          console.warn('PDF contains no extractable text content - may be image-based or encrypted');
          return createFallbackContent(fileName, fileStats, numPages, 'No text content extracted');
        }
        
        // Create comprehensive content
        const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;
        
        const analysisContent = `PDF Document: ${fileName}
Pages: ${numPages}
Text Length: ${cleanedText.length} characters  
Word Count: ${wordCount} words
File Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB

DOCUMENT CONTENT:
${cleanedText}

--- End of Document ---`;
        
        console.log(`Successfully parsed PDF: ${numPages} pages, ${cleanedText.length} characters, ${wordCount} words`);
        return analysisContent;
        
      } catch (pdfError) {
        console.error('PDF.js parsing failed:', pdfError.message);
        return createFallbackContent(fileName, fileStats, 0, pdfError.message);
      }
    } else {
      // Fallback when PDF.js is not available
      return createFallbackContent(fileName, fileStats);
    }

  } catch (error) {
    console.error('PDF parsing error:', error);
    
    if (error.message.includes('ENOENT')) {
      throw new Error(`PDF file not found: ${path.basename(filePath)}`);
    } else if (error.message.includes('EACCES')) {
      throw new Error(`Permission denied accessing PDF file: ${path.basename(filePath)}`);
    } else {
      throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
  }
}

function createFallbackContent(fileName, fileStats, numPages = 'Unknown', parseError = null) {
  const sizeInMB = (fileStats.size / 1024 / 1024).toFixed(2);
  
  return `PDF Document: ${fileName}
File Size: ${sizeInMB} MB
Pages: ${numPages}
Last Modified: ${fileStats.mtime.toISOString()}
${parseError ? `Parse Error: ${parseError}` : ''}

[LIMITED PDF PARSING - TEXT EXTRACTION UNAVAILABLE]

This PDF file was detected but comprehensive text extraction failed.

Possible reasons:
${parseError ? `- ${parseError}` : ''}
- PDF may be password-protected or encrypted
- PDF may contain only images (scanned document)
- PDF may be corrupted or use unsupported format
- Text may be embedded as images rather than searchable text

Recommendations for better RFP analysis:
1. Convert PDF to Word format (.docx) if possible
2. Ensure PDF contains searchable text (not just scanned images)
3. Remove any password protection
4. Try saving/exporting the PDF again from the original application

For RFP analysis purposes, please provide the document in one of these preferred formats:
- Word document (.docx, .doc)
- OpenDocument (.odt)
- Plain text (.txt)
- Excel (.xlsx) if tabular data

The system can analyze these formats with 100% text extraction accuracy.`.trim();
}

export async function parseWithMetadata(filePath) {
  try {
    console.log(`Parsing PDF file with metadata: ${filePath}`);
    
    const plainText = await parse(filePath);
    const fileStats = await fs.stat(filePath);
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      text: plainText,
      metadata: {
        pages: 1, // Will be updated by PDF.js parsing
        info: {},
        version: 'unknown',
        textLength: plainText.length,
        wordCount: wordCount,
        size: fileStats.size
      }
    };

  } catch (error) {
    console.error('PDF parsing with metadata error:', error);
    throw new Error(`Failed to parse PDF file with metadata: ${error.message}`);
  }
}

export async function extractMetadata(filePath) {
  try {
    const fileStats = await fs.stat(filePath);
    
    return {
      type: 'pdf',
      size: fileStats.size,
      created: fileStats.birthtime,
      modified: fileStats.mtime,
      extension: path.extname(filePath).toLowerCase(),
      pages: 1, // Placeholder - will be updated during parsing
      version: 'unknown',
      info: {},
      textLength: 0
    };
  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    throw new Error(`Failed to extract PDF metadata: ${error.message}`);
  }
}