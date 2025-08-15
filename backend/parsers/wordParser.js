import mammoth from 'mammoth';
import fs from 'fs-extra';
import path from 'path';

export async function parse(filePath) {
  try {
    console.log(`Parsing Word file: ${filePath}`);
    
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Use mammoth to extract text from Word documents
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth conversion messages:', result.messages);
      // Log warnings but don't fail
      result.messages.forEach(message => {
        if (message.type === 'warning') {
          console.warn('Mammoth warning:', message.message);
        }
      });
    }
    
    const content = result.value;
    
    if (!content || content.trim().length === 0) {
      throw new Error('No text content found in Word document - file may be empty or corrupted');
    }
    
    // Clean up the extracted text
    const cleanedContent = content
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
      .trim();
    
    console.log(`Successfully parsed Word document. Content length: ${cleanedContent.length} characters`);
    return cleanedContent;

  } catch (error) {
    console.error('Word parsing error:', error);
    
    // Try to provide more specific error information
    if (error.message.includes('ENOENT')) {
      throw new Error(`Word file not found: ${path.basename(filePath)}`);
    } else if (error.message.includes('EACCES')) {
      throw new Error(`Permission denied accessing Word file: ${path.basename(filePath)}`);
    } else {
      throw new Error(`Failed to parse Word file: ${error.message}`);
    }
  }
}

export async function parseWithFormatting(filePath) {
  try {
    console.log(`Parsing Word file with formatting: ${filePath}`);
    
    // Extract HTML with basic formatting preserved
    const result = await mammoth.convertToHtml({ path: filePath });
    
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth conversion messages:', result.messages);
    }
    
    const htmlContent = result.value;
    
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('No content found in Word document');
    }
    
    return {
      html: htmlContent,
      plainText: await parse(filePath) // Also get plain text version
    };

  } catch (error) {
    console.error('Word parsing with formatting error:', error);
    throw new Error(`Failed to parse Word file with formatting: ${error.message}`);
  }
}

export async function extractMetadata(filePath) {
  try {
    const fileStats = await fs.stat(filePath);
    
    return {
      type: 'word',
      size: fileStats.size,
      created: fileStats.birthtime,
      modified: fileStats.mtime,
      extension: path.extname(filePath).toLowerCase()
    };
  } catch (error) {
    console.error('Word metadata extraction error:', error);
    throw new Error(`Failed to extract Word metadata: ${error.message}`);
  }
}