import { analyzeWithAI, getAvailableProviders, getBestProvider } from './aiProviders.js';
import dotenv from 'dotenv';

dotenv.config();

const BROADCAST_MEDIA_CONTEXT = `
You are an expert RFP analyst specializing in broadcast and media industry projects. 
Focus on these key areas:
- Broadcasting equipment and infrastructure
- Media production workflows
- Content delivery networks (CDN)
- Live streaming and video production
- Audio/video encoding and transcoding
- Media asset management systems
- Compliance with broadcast standards (EBU, SMPTE, etc.)
- Integration with existing broadcast systems
- Scalability and redundancy requirements
- 24/7 operational requirements
`;

export async function analyzeRFP(documentContent, preferredProvider = null, preferredModel = null) {
  try {
    console.log('Starting AI analysis of RFP document...');
    
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please configure OpenAI, Groq, or install Ollama.');
    }
    
    console.log('Available AI providers:', availableProviders.map(p => p.name).join(', '));
    
    const analysisPrompt = `
${BROADCAST_MEDIA_CONTEXT}

Analyze the following RFP document and provide a structured analysis in JSON format.

Extract and analyze:
1. Project title and type
2. Budget range (if mentioned)  
3. Timeline and key deadlines
4. Critical technical requirements
5. Risk factors and potential challenges
6. Opportunity areas for competitive advantage
7. Compliance and standards requirements
8. Integration requirements with existing systems
9. Performance and scalability requirements
10. Key evaluation criteria

Document content:
${documentContent}

Return your analysis as a JSON object with the following structure:
{
  "title": "Project title",
  "projectType": "Type of project (e.g., 'Broadcast Infrastructure Upgrade')",
  "budget": "Budget information or 'Not specified'",
  "timeline": "Timeline information",
  "keyDeadlines": ["deadline1", "deadline2"],
  "technicalRequirements": ["req1", "req2"],
  "complianceStandards": ["standard1", "standard2"],
  "integrationRequirements": ["integration1", "integration2"],
  "performanceRequirements": ["perf1", "perf2"],
  "riskFactors": [
    {"risk": "Risk description", "severity": "High|Medium|Low", "impact": "Impact description"},
  ],
  "opportunityAreas": ["opportunity1", "opportunity2"],
  "evaluationCriteria": ["criteria1", "criteria2"],
  "keyWords": ["keyword1", "keyword2"],
  "industrySpecific": {
    "broadcastStandards": ["standard1", "standard2"],
    "equipmentTypes": ["equipment1", "equipment2"],
    "workflowRequirements": ["workflow1", "workflow2"]
  }
}

Ensure all analysis is specific to the broadcast and media industry context.
`;

    // Use the multi-provider AI system with preferred provider/model
    const aiResponse = await analyzeWithAI(documentContent, analysisPrompt, preferredProvider, preferredModel);
    const responseText = aiResponse.content;
    
    console.log(`Analysis completed using ${aiResponse.provider} (${aiResponse.model})`);
    
    // Try to parse the JSON response
    let analysis;
    try {
      // Remove any markdown formatting if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback: create a structured response from the text
      analysis = {
        title: "Analysis completed - see details below",
        projectType: "Broadcast/Media Project",
        budget: "Not specified",
        timeline: "See analysis details",
        keyDeadlines: [],
        technicalRequirements: ["See analysis details"],
        complianceStandards: [],
        integrationRequirements: [],
        performanceRequirements: [],
        riskFactors: [
          {
            risk: "AI analysis parsing error - manual review needed",
            severity: "Medium",
            impact: "Analysis results may be incomplete"
          }
        ],
        opportunityAreas: ["Manual review recommended"],
        evaluationCriteria: [],
        keyWords: [],
        industrySpecific: {
          broadcastStandards: [],
          equipmentTypes: [],
          workflowRequirements: []
        },
        rawAnalysis: responseText
      };
    }
    
    // Add metadata
    analysis.analysisMetadata = {
      analyzedAt: new Date().toISOString(),
      provider: aiResponse.provider,
      model: aiResponse.model,
      contentLength: documentContent.length,
      usage: aiResponse.usage,
      processingTime: Date.now()
    };
    
    console.log('RFP analysis completed successfully');
    return analysis;
    
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error; // Don't use fallback - require real AI analysis
  }
}

// Fallback analysis for when no AI providers are available
export function createMockAnalysis(documentContent) {
  // Extract some basic information from the document
  const lines = documentContent.split('\n').filter(line => line.trim().length > 0);
  const wordCount = documentContent.split(/\s+/).length;
  
  // Try to extract potential project information
  const potentialTitle = lines.find(line => 
    line.length < 100 && 
    (line.toLowerCase().includes('rfp') || 
     line.toLowerCase().includes('request') || 
     line.toLowerCase().includes('proposal'))
  ) || lines[0] || 'RFP Analysis';
  
  // Look for budget/financial information
  const budgetLines = lines.filter(line => 
    line.toLowerCase().includes('budget') || 
    line.toLowerCase().includes('cost') || 
    line.toLowerCase().includes('$') ||
    line.toLowerCase().includes('price')
  );
  
  // Look for timeline information
  const timelineLines = lines.filter(line =>
    line.toLowerCase().includes('deadline') ||
    line.toLowerCase().includes('timeline') ||
    line.toLowerCase().includes('schedule') ||
    line.toLowerCase().includes('delivery') ||
    /\d+\s+(days?|weeks?|months?)/i.test(line)
  );
  
  return {
    title: potentialTitle.substring(0, 80),
    projectType: "Document Analysis (No AI Available)",
    budget: budgetLines.length > 0 ? "Budget information found in document" : "Budget not clearly specified",
    timeline: timelineLines.length > 0 ? "Timeline information found in document" : "Timeline not clearly specified",
    keyDeadlines: timelineLines.slice(0, 3).map(line => line.trim().substring(0, 100)),
    technicalRequirements: [
      "Document parsing completed successfully",
      `Document contains ${wordCount} words`,
      `Document has ${lines.length} lines of content`,
      "Full AI analysis requires working API provider"
    ],
    complianceStandards: [],
    integrationRequirements: [],
    performanceRequirements: [],
    riskFactors: [
      {
        risk: "AI analysis unavailable - manual review required",
        severity: "Medium",
        impact: "Document content extracted but detailed analysis requires AI provider setup"
      }
    ],
    opportunityAreas: [
      "Document successfully uploaded and parsed",
      "Text extraction working properly",
      "Ready for AI analysis once provider is configured"
    ],
    evaluationCriteria: [],
    keyWords: [],
    industrySpecific: {
      broadcastStandards: [],
      equipmentTypes: [],
      workflowRequirements: []
    },
    analysisMetadata: {
      analyzedAt: new Date().toISOString(),
      provider: "fallback",
      model: "document-parser",
      contentLength: documentContent.length,
      wordCount: wordCount,
      fallbackReason: "No AI providers available with credits"
    },
    documentPreview: documentContent.substring(0, 500) + (documentContent.length > 500 ? '...' : '')
  };
}

export async function extractKeywords(documentContent) {
  try {
    console.log('Extracting keywords from document...');
    
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      console.warn('No AI providers available for keyword extraction');
      return [];
    }
    
    const keywordPrompt = `
Extract the most important keywords and phrases from this broadcast/media industry RFP document.
Focus on:
- Technical terms and equipment names
- Industry standards and protocols
- Project requirements and deliverables
- Compliance and regulatory terms
- Workflow and operational terms

Return only a JSON array of strings, ordered by relevance:
["keyword1", "keyword2", "keyword3", ...]

Document content:
${documentContent.substring(0, 3000)} // Limit for keyword extraction
`;

    const aiResponse = await analyzeWithAI(documentContent, keywordPrompt);
    const responseText = aiResponse.content;
    
    try {
      const keywords = JSON.parse(responseText);
      return Array.isArray(keywords) ? keywords : [];
    } catch (parseError) {
      console.error('Failed to parse keywords JSON:', parseError);
      return [];
    }
    
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return [];
  }
}