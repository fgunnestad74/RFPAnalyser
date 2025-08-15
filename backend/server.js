import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Import our modules
import * as odfParser from './parsers/odfParser.js';
import * as wordParser from './parsers/wordParser.js';
import * as excelParser from './parsers/excelParser.js';
import * as pdfParser from './parsers/pdfParser.js';
import * as analyzer from './ai/analyzer.js';
import * as comprehensiveAnalyzer from './ai/comprehensiveAnalyzer.js';
import * as responseGenerator from './ai/responseGenerator.js';
import * as fileManager from './storage/fileManager.js';
import { initializeProviders, getAvailableProviders } from './ai/aiProviders.js';
import * as googleDrive from './storage/googleDrive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// OpenAI API key loaded from environment

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'data', 'uploads');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.odt', '.ods', '.xlsx', '.xls', '.txt']; // Added .txt for testing
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, ODF, Excel, and TXT files are allowed.'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check configuration status
app.get('/api/config', async (req, res) => {
  try {
    const aiProviders = await initializeProviders();
    
    // Test Google Drive connection
    let driveConfigured = false;
    let driveUserInfo = null;
    try {
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        driveUserInfo = await googleDrive.testConnection();
        driveConfigured = true;
      }
    } catch (driveError) {
      console.log('Google Drive connection test failed:', driveError.message);
    }
    
    res.json({
      aiConfigured: aiProviders.total > 0,
      aiProviders: aiProviders.available,
      recommendedProvider: aiProviders.recommended,
      driveConfigured,
      driveUserInfo,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config check error:', error);
    res.json({
      aiConfigured: false,
      aiProviders: [],
      driveConfigured: false,
      serverTime: new Date().toISOString(),
      error: 'Failed to check AI provider status'
    });
  }
});

// Helper function to process a single file
async function processFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  console.log(`Processing file: ${file.originalname} (${extension})`);

  let parsedContent;
  
  // Route to appropriate parser based on file extension
  try {
    switch (extension) {
      case '.odt':
      case '.ods':
        parsedContent = await odfParser.parse(file.path);
        break;
      case '.doc':
      case '.docx':
        parsedContent = await wordParser.parse(file.path);
        break;
      case '.xlsx':
      case '.xls':
        parsedContent = await excelParser.parse(file.path);
        break;
      case '.pdf':
        parsedContent = await pdfParser.parse(file.path);
        break;
      case '.txt':
        // Simple text file reader for testing
        parsedContent = await fs.readFile(file.path, 'utf8');
        break;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
    
    console.log(`Document parsed successfully. Content length: ${parsedContent.length} characters`);
  } catch (parseError) {
    console.error('Document parsing error:', parseError);
    parsedContent = `Error parsing ${file.originalname}: ${parseError.message}\nFile size: ${file.size} bytes\nPlease try with a different document.`;
  }

  // Save parsed content
  const contentId = uuidv4();
  await fileManager.saveProcessedContent(contentId, {
    originalFile: file.originalname,
    content: parsedContent,
    metadata: {
      size: file.size,
      mimeType: file.mimetype,
      processedAt: new Date().toISOString(),
      extension: extension
    }
  });

  // Clean up uploaded file
  await fs.remove(file.path);

  return {
    success: true,
    contentId,
    originalFile: file.originalname,
    size: file.size,
    preview: parsedContent.substring(0, 500) + '...'
  };
}

// Upload and parse single document (existing endpoint)
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await processFile(req.file);
    res.json(result);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload and parse multiple documents
app.post('/api/upload-multiple', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`Processing ${req.files.length} files...`);

    // Process all files
    const results = await Promise.allSettled(
      req.files.map(file => processFile(file))
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          file: req.files[index].originalname,
          error: result.reason.message
        });
      }
    });

    res.json({
      success: true,
      processed: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed,
      message: `Successfully processed ${successful.length} of ${req.files.length} files`
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze single document
app.post('/api/analyze', async (req, res) => {
  try {
    const { contentId, provider, model } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    // Get processed content
    const processedDoc = await fileManager.getProcessedContent(contentId);
    if (!processedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('Starting AI analysis for document:', processedDoc.originalFile);
    console.log('Using provider:', provider, 'model:', model);
    
    // Perform comprehensive AI analysis with selected provider/model
    const analysis = await comprehensiveAnalyzer.analyzeRFPComprehensive(processedDoc.content, provider, model);
    
    // Save analysis results
    await fileManager.saveAnalysis(contentId, analysis);
    
    console.log('AI analysis completed for:', processedDoc.originalFile);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze multiple documents
app.post('/api/analyze-multiple', async (req, res) => {
  try {
    const { contentIds, provider, model } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ error: 'Content IDs array is required' });
    }

    console.log(`Starting AI analysis for ${contentIds.length} documents`);
    console.log('Using provider:', provider, 'model:', model);

    // Get all processed documents
    const processedDocs = await Promise.all(
      contentIds.map(async (contentId) => {
        const doc = await fileManager.getProcessedContent(contentId);
        if (!doc) {
          throw new Error(`Document with ID ${contentId} not found`);
        }
        return { contentId, ...doc };
      })
    );

    // Combine all document content for comprehensive analysis
    const combinedContent = processedDocs.map((doc, index) => 
      `\n\n=== DOCUMENT ${index + 1}: ${doc.originalFile} ===\n${doc.content}`
    ).join('\n');

    const contextualPrompt = `
You are analyzing ${processedDocs.length} related documents for an RFP analysis:

Documents being analyzed:
${processedDocs.map((doc, i) => `${i + 1}. ${doc.originalFile}`).join('\n')}

Please analyze these documents as a comprehensive set, considering:
1. How they relate to each other
2. Any conflicting or complementary information
3. The complete picture they provide for the RFP
4. Cross-references between documents

Combined content:
${combinedContent}
`;

    // Perform comprehensive AI analysis on combined content
    const analysis = await comprehensiveAnalyzer.analyzeRFPComprehensive(contextualPrompt, provider, model);
    
    // Add metadata about multi-document analysis
    analysis.multiDocumentAnalysis = {
      documentCount: processedDocs.length,
      documents: processedDocs.map(doc => ({
        contentId: doc.contentId,
        filename: doc.originalFile,
        size: doc.metadata?.size || 0
      })),
      analyzedAt: new Date().toISOString()
    };

    // Save analysis results for the primary document (first one)
    await fileManager.saveAnalysis(contentIds[0], analysis);
    
    console.log(`AI analysis completed for ${contentIds.length} documents`);

    res.json({
      success: true,
      analysis,
      documentsAnalyzed: processedDocs.length,
      primaryDocument: processedDocs[0].originalFile
    });

  } catch (error) {
    console.error('Multi-document analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Assistant endpoint
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { contentId, question, provider, model } = req.body;
    
    if (!contentId || !question) {
      return res.status(400).json({ error: 'Content ID and question are required' });
    }

    // Get processed content
    const processedDoc = await fileManager.getProcessedContent(contentId);
    if (!processedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('AI Assistant question:', question);
    console.log('Using provider:', provider, 'model:', model);
    
    // Create a comprehensive prompt for RFP assistance
    const assistantPrompt = `You are an expert RFP (Request for Proposal) assistant specializing in the broadcast and media industry. 

DOCUMENT CONTEXT:
${processedDoc.content}

USER QUESTION:
${question}

Please provide a comprehensive, professional response that:
1. Addresses the specific question based on the RFP document content
2. Provides actionable insights and recommendations
3. Highlights any specific requirements, deadlines, or criteria from the RFP
4. Suggests next steps or considerations for proposal preparation
5. Uses clear, professional language suitable for business contexts

Focus on being thorough yet concise, and always reference specific information from the RFP document when available.`;

    // Use the multi-provider AI system
    const { analyzeWithAI } = await import('./ai/aiProviders.js');
    const aiResponse = await analyzeWithAI(processedDoc.content, assistantPrompt, provider, model);
    
    console.log(`AI Assistant response completed using ${aiResponse.provider} (${aiResponse.model})`);
    
    res.json({
      success: true,
      answer: aiResponse.content,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find relevant historical documents
app.post('/api/find-documents', async (req, res) => {
  try {
    const { contentId, keywords } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    // Placeholder for document search
    const relevantDocs = [
      {
        id: "1",
        name: "Previous Broadcast RFP Response.docx",
        relevance: 85,
        lastUsed: "2 weeks ago"
      }
    ];
    
    res.json({
      success: true,
      documents: relevantDocs
    });

  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate response
app.post('/api/generate-response', async (req, res) => {
  try {
    const { contentId, selectedDocuments, customInstructions } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    // Placeholder for response generation
    const response = {
      content: "# RFP Response\n\n## Executive Summary\nThis is a placeholder response that would be generated based on the RFP analysis and historical documents.\n\n## Technical Approach\nDetailed technical solution would be provided here.\n\n## Timeline and Costs\nProject timeline and cost breakdown would be included.",
      metadata: {
        generatedAt: new Date().toISOString(),
        wordCount: 150
      }
    };

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Drive endpoints
app.get('/api/drive/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    console.log('Listing contents of Google Drive folder:', folderId);
    
    const files = await googleDrive.listFolderContents(folderId);
    
    // Filter only supported file types and add additional metadata
    const supportedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];

    const supportedFiles = files.filter(file => 
      supportedMimeTypes.includes(file.mimeType)
    ).map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size) || 0,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      fileType: getFileTypeFromMimeType(file.mimeType),
      formattedSize: formatFileSize(parseInt(file.size) || 0),
      formattedDate: formatRelativeTime(file.modifiedTime)
    }));

    res.json({
      success: true,
      folderId,
      files: supportedFiles,
      totalFiles: supportedFiles.length,
      message: `Found ${supportedFiles.length} supported documents in folder`
    });

  } catch (error) {
    console.error('Google Drive folder listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download and process Google Drive files
app.post('/api/drive/analyze', async (req, res) => {
  try {
    const { fileIds, provider, model } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    console.log(`Processing ${fileIds.length} Google Drive files for analysis`);

    const results = [];
    const tempDir = path.join(__dirname, 'data', 'temp');
    await fs.ensureDir(tempDir);

    // Download and process each file
    for (const fileId of fileIds) {
      try {
        // Get file metadata first
        const metadata = await googleDrive.getDocumentMetadata(fileId);
        const extension = getExtensionFromMimeType(metadata.mimeType);
        const tempPath = path.join(tempDir, `${fileId}${extension}`);
        
        console.log(`Downloading ${metadata.name} from Google Drive...`);
        
        // Download the file
        await googleDrive.downloadDocument(fileId, tempPath);
        
        // Process the file using existing logic
        const mockFile = {
          path: tempPath,
          originalname: metadata.name,
          size: parseInt(metadata.size) || 0,
          mimetype: metadata.mimeType
        };
        
        const result = await processFile(mockFile);
        result.source = 'google_drive';
        result.driveFileId = fileId;
        result.webViewLink = metadata.webViewLink;
        
        results.push(result);
        
        // Clean up temp file
        await fs.remove(tempPath);
        
      } catch (fileError) {
        console.error(`Error processing file ${fileId}:`, fileError);
        results.push({
          error: true,
          fileId,
          message: fileError.message
        });
      }
    }

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    if (successful.length === 0) {
      return res.status(500).json({ error: 'Failed to process any files' });
    }

    // If we have successful downloads, proceed with analysis
    const contentIds = successful.map(r => r.contentId);
    
    let analysisResult;
    if (contentIds.length === 1) {
      // Single document analysis
      analysisResult = await fetch(`http://localhost:${PORT}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentId: contentIds[0], 
          provider, 
          model 
        })
      }).then(r => r.json());
    } else {
      // Multiple document analysis
      analysisResult = await fetch(`http://localhost:${PORT}/api/analyze-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentIds, 
          provider, 
          model 
        })
      }).then(r => r.json());
    }

    res.json({
      success: true,
      processed: successful.length,
      failed: failed.length,
      files: successful,
      errors: failed,
      analysis: analysisResult.analysis,
      contentIds,
      message: `Successfully processed ${successful.length} of ${fileIds.length} Google Drive files`
    });

  } catch (error) {
    console.error('Google Drive analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      documents: { processed: 0, totalSize: 0 },
      analyses: { count: 0 },
      responses: { count: 0 },
      lastUpdated: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for Google Drive
function getFileTypeFromMimeType(mimeType) {
  const typeMap = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.oasis.opendocument.text': 'ODF Text',
    'application/vnd.oasis.opendocument.spreadsheet': 'ODF Spreadsheet'
  };
  return typeMap[mimeType] || 'Document';
}

function getExtensionFromMimeType(mimeType) {
  const extMap = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.oasis.opendocument.text': '.odt',
    'application/vnd.oasis.opendocument.spreadsheet': '.ods'
  };
  return extMap[mimeType] || '.bin';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  
  return `${Math.ceil(diffDays / 365)} years ago`;
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`RFP Analyzer backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;