import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directories
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
const EMBEDDINGS_DIR = path.join(DATA_DIR, 'embeddings');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const RESPONSES_DIR = path.join(DATA_DIR, 'responses');
const ANALYSIS_DIR = path.join(DATA_DIR, 'analysis');

// Ensure directories exist
export async function initializeStorage() {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(PROCESSED_DIR);
    await fs.ensureDir(EMBEDDINGS_DIR);
    await fs.ensureDir(CACHE_DIR);
    await fs.ensureDir(UPLOADS_DIR);
    await fs.ensureDir(RESPONSES_DIR);
    await fs.ensureDir(ANALYSIS_DIR);
    
    console.log('Storage directories initialized');
  } catch (error) {
    console.error('Storage initialization error:', error);
    throw error;
  }
}

// Initialize storage directories
initializeStorage().catch(console.error);

// Save processed document content
export async function saveProcessedContent(contentId, data) {
  try {
    const filePath = path.join(PROCESSED_DIR, `${contentId}.json`);
    
    const record = {
      id: contentId,
      ...data,
      savedAt: new Date().toISOString()
    };
    
    await fs.writeJSON(filePath, record, { spaces: 2 });
    console.log(`Processed content saved: ${contentId}`);
    
    return contentId;
  } catch (error) {
    console.error('Save processed content error:', error);
    throw error;
  }
}

// Get processed document content
export async function getProcessedContent(contentId) {
  try {
    const filePath = path.join(PROCESSED_DIR, `${contentId}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const content = await fs.readJSON(filePath);
    return content;
  } catch (error) {
    console.error('Get processed content error:', error);
    throw error;
  }
}

// Save analysis results
export async function saveAnalysis(contentId, analysis) {
  try {
    const filePath = path.join(ANALYSIS_DIR, `${contentId}.json`);
    
    const record = {
      contentId,
      analysis,
      savedAt: new Date().toISOString()
    };
    
    await fs.writeJSON(filePath, record, { spaces: 2 });
    console.log(`Analysis saved: ${contentId}`);
    
    return contentId;
  } catch (error) {
    console.error('Save analysis error:', error);
    throw error;
  }
}

// Get analysis results
export async function getAnalysis(contentId) {
  try {
    const filePath = path.join(ANALYSIS_DIR, `${contentId}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const record = await fs.readJSON(filePath);
    return record.analysis;
  } catch (error) {
    console.error('Get analysis error:', error);
    throw error;
  }
}

// Save generated response
export async function saveResponse(contentId, response) {
  try {
    const responseId = uuidv4();
    const filePath = path.join(RESPONSES_DIR, `${responseId}.json`);
    
    const record = {
      id: responseId,
      contentId,
      response,
      savedAt: new Date().toISOString()
    };
    
    await fs.writeJSON(filePath, record, { spaces: 2 });
    console.log(`Response saved: ${responseId}`);
    
    return responseId;
  } catch (error) {
    console.error('Save response error:', error);
    throw error;
  }
}

// Get generated response
export async function getResponse(responseId) {
  try {
    const filePath = path.join(RESPONSES_DIR, `${responseId}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const record = await fs.readJSON(filePath);
    return record;
  } catch (error) {
    console.error('Get response error:', error);
    throw error;
  }
}

// List all responses for a content ID
export async function getResponsesForContent(contentId) {
  try {
    const files = await fs.readdir(RESPONSES_DIR);
    const responses = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(RESPONSES_DIR, file);
        const record = await fs.readJSON(filePath);
        
        if (record.contentId === contentId) {
          responses.push(record);
        }
      }
    }
    
    // Sort by creation date (newest first)
    responses.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    return responses;
  } catch (error) {
    console.error('Get responses for content error:', error);
    throw error;
  }
}

// Save document embeddings for similarity search
export async function saveEmbeddings(contentId, embeddings) {
  try {
    const filePath = path.join(EMBEDDINGS_DIR, `${contentId}.json`);
    
    const record = {
      contentId,
      embeddings,
      savedAt: new Date().toISOString()
    };
    
    await fs.writeJSON(filePath, record, { spaces: 2 });
    console.log(`Embeddings saved: ${contentId}`);
    
    return contentId;
  } catch (error) {
    console.error('Save embeddings error:', error);
    throw error;
  }
}

// Get document embeddings
export async function getEmbeddings(contentId) {
  try {
    const filePath = path.join(EMBEDDINGS_DIR, `${contentId}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const record = await fs.readJSON(filePath);
    return record.embeddings;
  } catch (error) {
    console.error('Get embeddings error:', error);
    throw error;
  }
}

// Cache management
export async function saveToCache(key, data, ttlHours = 24) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    
    const record = {
      key,
      data,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (ttlHours * 60 * 60 * 1000)).toISOString()
    };
    
    await fs.writeJSON(filePath, record, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Save to cache error:', error);
    return false;
  }
}

export async function getFromCache(key) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    
    const record = await fs.readJSON(filePath);
    
    // Check if expired
    if (new Date() > new Date(record.expiresAt)) {
      await fs.remove(filePath);
      return null;
    }
    
    return record.data;
  } catch (error) {
    console.error('Get from cache error:', error);
    return null;
  }
}

// Clean up expired cache entries
export async function cleanupCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    let cleaned = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        
        try {
          const record = await fs.readJSON(filePath);
          
          if (new Date() > new Date(record.expiresAt)) {
            await fs.remove(filePath);
            cleaned++;
          }
        } catch (error) {
          // If we can't read the file, remove it
          await fs.remove(filePath);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

// System statistics
export async function getSystemStats() {
  try {
    const stats = {
      documents: {
        processed: 0,
        totalSize: 0
      },
      analyses: {
        count: 0
      },
      responses: {
        count: 0
      },
      cache: {
        entries: 0,
        size: 0
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Count processed documents
    try {
      const processedFiles = await fs.readdir(PROCESSED_DIR);
      stats.documents.processed = processedFiles.filter(f => f.endsWith('.json')).length;
      
      // Calculate total size
      for (const file of processedFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(PROCESSED_DIR, file);
          const stat = await fs.stat(filePath);
          stats.documents.totalSize += stat.size;
        }
      }
    } catch (error) {
      console.error('Error counting processed documents:', error);
    }
    
    // Count analyses
    try {
      const analysisFiles = await fs.readdir(ANALYSIS_DIR);
      stats.analyses.count = analysisFiles.filter(f => f.endsWith('.json')).length;
    } catch (error) {
      console.error('Error counting analyses:', error);
    }
    
    // Count responses
    try {
      const responseFiles = await fs.readdir(RESPONSES_DIR);
      stats.responses.count = responseFiles.filter(f => f.endsWith('.json')).length;
    } catch (error) {
      console.error('Error counting responses:', error);
    }
    
    // Count cache entries
    try {
      const cacheFiles = await fs.readdir(CACHE_DIR);
      stats.cache.entries = cacheFiles.filter(f => f.endsWith('.json')).length;
      
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(CACHE_DIR, file);
          const stat = await fs.stat(filePath);
          stats.cache.size += stat.size;
        }
      }
    } catch (error) {
      console.error('Error counting cache:', error);
    }
    
    return stats;
  } catch (error) {
    console.error('Get system stats error:', error);
    throw error;
  }
}

// Clean up old files (older than specified days)
export async function cleanupOldFiles(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const directories = [PROCESSED_DIR, ANALYSIS_DIR, RESPONSES_DIR, EMBEDDINGS_DIR];
    let totalCleaned = 0;
    
    for (const dir of directories) {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dir, file);
          const stat = await fs.stat(filePath);
          
          if (stat.mtime < cutoffDate) {
            await fs.remove(filePath);
            totalCleaned++;
          }
        }
      }
    }
    
    console.log(`Cleaned ${totalCleaned} old files (older than ${daysOld} days)`);
    return totalCleaned;
  } catch (error) {
    console.error('Cleanup old files error:', error);
    throw error;
  }
}