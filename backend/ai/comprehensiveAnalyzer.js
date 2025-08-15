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

export async function analyzeRFPComprehensive(documentContent, preferredProvider = null, preferredModel = null) {
  try {
    console.log('Starting comprehensive AI analysis of RFP document...');
    
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please configure OpenAI, Groq, or install Ollama.');
    }
    
    console.log('Available AI providers:', availableProviders.map(p => p.name).join(', '));
    
    const comprehensivePrompt = `
${BROADCAST_MEDIA_CONTEXT}

You are reviewing an RFP document for comprehensive analysis and proposal preparation. Please provide a detailed, structured analysis covering all the following areas:

COMPREHENSION AND HIGHLIGHTING
Carefully read the entire RFP and extract:
- The main objectives and purpose of the RFP
- Key eligibility criteria or requirements
- Important deadlines and submission instructions
- Any mandatory deliverables, forms, or templates
- Evaluation criteria or scoring mechanisms
- Contact points or Q&A instructions

TECHNICAL REQUIREMENTS BREAKDOWN
Identify and list:
- All technical specifications, functional requirements, or service-level expectations
- Any ambiguities, conflicts, or areas requiring clarification
- Compliance requirements (certifications, data protection, security standards)

RESPONSE STRATEGY
Based on the RFP:
- Suggest a response structure (executive summary, technical approach, team bios, pricing)
- Suggest key messaging or value propositions to emphasize
- Identify risks or potential gaps in ability to meet requirements, with recommendations

DRAFTING GUIDANCE
- Provide draft response outline for each RFP section
- Highlight compliance with specific RFP criteria
- Suggest persuasive and professional language approaches

Document content:
${documentContent}

Return your analysis as a JSON object with the following comprehensive structure:
{
  "title": "Project title extracted from RFP",
  "projectType": "Type of project (e.g., 'Broadcast Infrastructure Upgrade')",
  "budget": "Budget information or 'Not specified'",
  "timeline": "Timeline information",
  
  "comprehensionHighlighting": {
    "mainObjectives": ["objective1", "objective2"],
    "rfpPurpose": "Primary purpose and goals",
    "eligibilityCriteria": ["criteria1", "criteria2"],
    "deadlinesSubmission": [
      {"deadline": "deadline description", "date": "date if specified", "importance": "High|Medium|Low"}
    ],
    "mandatoryDeliverables": ["deliverable1", "deliverable2"],
    "evaluationCriteria": [
      {"criteria": "evaluation criteria", "weight": "percentage if given", "description": "details"}
    ],
    "contactPoints": ["contact1", "contact2"],
    "qaInstructions": ["instruction1", "instruction2"]
  },
  
  "technicalBreakdown": {
    "technicalSpecifications": ["spec1", "spec2"],
    "functionalRequirements": ["req1", "req2"],
    "serviceLevelExpectations": ["sla1", "sla2"],
    "performanceRequirements": ["perf1", "perf2"],
    "ambiguitiesConflicts": ["ambiguity1", "ambiguity2"],
    "clarificationNeeded": ["question1", "question2"],
    "complianceRequirements": [
      {"requirement": "compliance req", "type": "certification|data protection|security", "mandatory": true, "details": "specifics"}
    ]
  },
  
  "responseStrategy": {
    "suggestedStructure": [
      {"section": "Executive Summary", "content": "what to include", "keyPoints": ["point1", "point2"]},
      {"section": "Technical Approach", "content": "what to include", "keyPoints": ["point1", "point2"]},
      {"section": "Team & Experience", "content": "what to include", "keyPoints": ["point1", "point2"]},
      {"section": "Project Management", "content": "what to include", "keyPoints": ["point1", "point2"]},
      {"section": "Pricing", "content": "what to include", "keyPoints": ["point1", "point2"]}
    ],
    "keyMessaging": ["message1", "message2"],
    "valuePropositions": ["proposition1", "proposition2"],
    "uniqueSellingPoints": ["usp1", "usp2"],
    "riskFactors": [
      {"risk": "Risk description", "severity": "High|Medium|Low", "impact": "Impact description", "mitigation": "suggested mitigation"}
    ],
    "competitiveAdvantages": ["advantage1", "advantage2"],
    "differentiationStrategy": ["strategy1", "strategy2"]
  },
  
  "draftingGuidance": {
    "sectionOutlines": [
      {
        "section": "section name", 
        "outline": "detailed outline", 
        "keyPoints": ["point1", "point2"], 
        "complianceNotes": "specific RFP requirements to address",
        "suggestedContent": "draft content suggestions"
      }
    ],
    "persuasiveLanguage": ["language tip1", "language tip2"],
    "professionalTone": ["tone guidance1", "tone guidance2"],
    "winThemes": ["theme1", "theme2"],
    "clientFocus": ["client benefit1", "client benefit2"],
    "proofPoints": ["proof point1", "proof point2"]
  },
  
  "industrySpecific": {
    "broadcastStandards": ["standard1", "standard2"],
    "equipmentTypes": ["equipment1", "equipment2"],
    "workflowRequirements": ["workflow1", "workflow2"],
    "mediaSpecificConsiderations": ["consideration1", "consideration2"],
    "technologyTrends": ["trend1", "trend2"],
    "regulatoryConsiderations": ["regulation1", "regulation2"]
  },
  
  "actionItems": [
    {"item": "action item", "priority": "High|Medium|Low", "deadline": "when needed", "owner": "who should do it", "description": "detailed description"}
  ],
  
  "proposalTimeline": [
    {"phase": "phase name", "duration": "time needed", "activities": ["activity1", "activity2"], "deliverables": ["deliverable1"]}
  ],
  
  "budgetConsiderations": {
    "costFactors": ["factor1", "factor2"],
    "pricingStrategy": "strategy recommendations",
    "budgetRisks": ["risk1", "risk2"]
  }
}

Ensure all analysis is thorough, specific to the broadcast and media industry context, and provides actionable guidance for proposal preparation.`;

    // Use the multi-provider AI system with preferred provider/model
    const aiResponse = await analyzeWithAI(documentContent, comprehensivePrompt, preferredProvider, preferredModel);
    const responseText = aiResponse.content;
    
    console.log(`Comprehensive analysis completed using ${aiResponse.provider} (${aiResponse.model})`);
    
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
        title: "Comprehensive Analysis - see details below",
        projectType: "Broadcast/Media Project",
        budget: "Not specified",
        timeline: "See analysis details",
        comprehensiveAnalysis: responseText,
        analysisNote: "The AI provided a detailed analysis that couldn't be automatically structured. Please review the comprehensive analysis section above."
      };
    }
    
    // Add metadata
    analysis.analysisMetadata = {
      analyzedAt: new Date().toISOString(),
      provider: aiResponse.provider,
      model: aiResponse.model,
      contentLength: documentContent.length,
      usage: aiResponse.usage,
      processingTime: Date.now(),
      analysisType: 'comprehensive'
    };
    
    console.log('Comprehensive RFP analysis completed successfully');
    return analysis;
    
  } catch (error) {
    console.error('Comprehensive AI analysis error:', error);
    throw error;
  }
}