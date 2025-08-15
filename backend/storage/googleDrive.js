import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import * as fileManager from './fileManager.js';

dotenv.config();

let drive = null;
let isConfigured = false;

// Initialize Google Drive API with Service Account
export async function initializeDrive() {
  try {
    // Check if we have the required Service Account credentials
    if (!process.env.GOOGLE_CLIENT_EMAIL || 
        !process.env.GOOGLE_PRIVATE_KEY || 
        !process.env.GOOGLE_PROJECT_ID) {
      console.log('Google Drive Service Account credentials not configured');
      console.log('Required env vars: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID');
      return false;
    }

    // Create Service Account authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    drive = google.drive({ version: 'v3', auth });
    isConfigured = true;
    
    console.log('Google Drive API initialized successfully with Service Account');
    console.log('Service account email:', process.env.GOOGLE_CLIENT_EMAIL);
    return true;
  } catch (error) {
    console.error('Google Drive initialization error:', error);
    return false;
  }
}

// Test the connection
export async function testConnection() {
  if (!isConfigured) {
    await initializeDrive();
  }
  
  if (!drive) {
    throw new Error('Google Drive not configured');
  }

  try {
    const response = await drive.about.get({ fields: 'user' });
    console.log('Google Drive connection test successful:', response.data.user.emailAddress);
    return response.data.user;
  } catch (error) {
    console.error('Google Drive connection test failed:', error);
    throw error;
  }
}

// Find relevant documents based on analysis
export async function findRelevantDocuments(analysis, additionalKeywords = []) {
  if (!isConfigured) {
    await initializeDrive();
  }
  
  if (!drive) {
    console.log('Google Drive not configured - returning empty results');
    return [];
  }

  try {
    // Build search keywords from analysis
    let searchKeywords = [];
    
    if (analysis.keyWords && analysis.keyWords.length > 0) {
      searchKeywords.push(...analysis.keyWords);
    }
    
    if (analysis.technicalRequirements && analysis.technicalRequirements.length > 0) {
      searchKeywords.push(...analysis.technicalRequirements);
    }
    
    if (analysis.industrySpecific) {
      if (analysis.industrySpecific.equipmentTypes) {
        searchKeywords.push(...analysis.industrySpecific.equipmentTypes);
      }
      if (analysis.industrySpecific.broadcastStandards) {
        searchKeywords.push(...analysis.industrySpecific.broadcastStandards);
      }
    }
    
    if (additionalKeywords && additionalKeywords.length > 0) {
      searchKeywords.push(...additionalKeywords);
    }
    
    // Remove duplicates and filter out short terms
    searchKeywords = [...new Set(searchKeywords)].filter(kw => kw && kw.length > 2);
    
    console.log('Searching Google Drive with keywords:', searchKeywords.slice(0, 10));
    
    const results = [];
    const searchedFiles = new Set(); // Prevent duplicates
    
    // Search for documents using different keyword combinations
    for (const keyword of searchKeywords.slice(0, 5)) { // Limit to first 5 keywords to avoid API limits
      try {
        const searchQuery = `fullText contains '${keyword}' and (mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword' or mimeType='application/pdf')`;
        
        const response = await drive.files.list({
          q: searchQuery,
          fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)',
          pageSize: 10
        });

        const files = response.data.files || [];
        
        for (const file of files) {
          if (!searchedFiles.has(file.id)) {
            searchedFiles.add(file.id);
            
            // Calculate relevance score (simple implementation)
            let relevanceScore = 0;
            const fileName = file.name.toLowerCase();
            
            for (const kw of searchKeywords.slice(0, 10)) {
              if (fileName.includes(kw.toLowerCase())) {
                relevanceScore += 10;
              }
            }
            
            // Bonus points for recent files
            const fileDate = new Date(file.modifiedTime);
            const daysSinceModified = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < 365) {
              relevanceScore += Math.max(0, 20 - Math.floor(daysSinceModified / 30));
            }
            
            results.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: file.size,
              createdTime: file.createdTime,
              modifiedTime: file.modifiedTime,
              webViewLink: file.webViewLink,
              relevanceScore,
              matchedKeyword: keyword
            });
          }
        }
      } catch (searchError) {
        console.error(`Search error for keyword "${keyword}":`, searchError.message);
        // Continue with other keywords
      }
    }
    
    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Add metadata and format for frontend
    const formattedResults = results.slice(0, 20).map(file => ({
      id: file.id,
      name: file.name,
      relevance: Math.min(99, Math.max(1, Math.round(file.relevanceScore))),
      lastUsed: formatRelativeTime(file.modifiedTime),
      size: formatFileSize(parseInt(file.size) || 0),
      type: getFileTypeDisplay(file.mimeType),
      webViewLink: file.webViewLink,
      metadata: {
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        mimeType: file.mimeType,
        matchedKeyword: file.matchedKeyword
      }
    }));
    
    console.log(`Found ${formattedResults.length} relevant documents`);
    
    // Cache the results
    const cacheKey = `search_${Buffer.from(searchKeywords.join('+')).toString('base64').slice(0, 32)}`;
    await fileManager.saveToCache(cacheKey, formattedResults, 6); // Cache for 6 hours
    
    return formattedResults;

  } catch (error) {
    console.error('Google Drive search error:', error);
    throw error;
  }
}

// Download a specific document for content analysis
export async function downloadDocument(fileId, downloadPath) {
  if (!drive) {
    throw new Error('Google Drive not configured');
  }

  try {
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    await fs.writeFile(downloadPath, response.data);
    console.log(`Document downloaded: ${fileId} -> ${downloadPath}`);
    
    return downloadPath;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Get document metadata without downloading
export async function getDocumentMetadata(fileId) {
  if (!drive) {
    throw new Error('Google Drive not configured');
  }

  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,description,webViewLink,thumbnailLink'
    });

    return response.data;
  } catch (error) {
    console.error('Get metadata error:', error);
    throw error;
  }
}

// List files in a specific folder (for historical documents folder)
export async function listFolderContents(folderId) {
  if (!drive) {
    throw new Error('Google Drive not configured');
  }

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    return response.data.files || [];
  } catch (error) {
    console.error('List folder contents error:', error);
    throw error;
  }
}

// Helper functions
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

function getFileTypeDisplay(mimeType) {
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

// Initialize on import
await initializeDrive();