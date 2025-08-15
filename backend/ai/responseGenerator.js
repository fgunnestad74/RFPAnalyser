import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RESPONSE_TEMPLATE_CONTEXT = `
You are an expert proposal writer specializing in broadcast and media industry RFPs.
Your responses should demonstrate:
- Deep technical knowledge of broadcast systems
- Understanding of industry standards and compliance
- Experience with 24/7 operational requirements
- Knowledge of integration challenges and solutions
- Awareness of scalability and redundancy needs
- Familiarity with broadcast workflows and equipment
`;

export async function generateResponse(options) {
  try {
    const { analysis, originalContent, selectedDocuments, customInstructions } = options;
    
    console.log('Starting AI response generation...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Build context from selected documents
    let historicalContext = '';
    if (selectedDocuments && selectedDocuments.length > 0) {
      historicalContext = `
Previous Relevant Experience:
${selectedDocuments.map(doc => `
- ${doc.name}: ${doc.summary || 'Relevant experience'}
`).join('')}
`;
    }
    
    const responsePrompt = `
${RESPONSE_TEMPLATE_CONTEXT}

Generate a comprehensive RFP response based on the analysis and requirements below.

RFP Analysis:
- Title: ${analysis.title}
- Project Type: ${analysis.projectType}
- Budget: ${analysis.budget}
- Timeline: ${analysis.timeline}
- Key Requirements: ${analysis.technicalRequirements?.join(', ')}
- Compliance Standards: ${analysis.complianceStandards?.join(', ')}
- Risk Factors: ${analysis.riskFactors?.map(r => r.risk).join(', ')}

${historicalContext}

Custom Instructions: ${customInstructions || 'None'}

Generate a professional RFP response with the following sections:

1. EXECUTIVE SUMMARY
   - Brief overview of our understanding and approach
   - Key value propositions
   - Competitive advantages

2. TECHNICAL APPROACH
   - Detailed solution architecture
   - Technical implementation plan
   - Integration with existing systems
   - Compliance with broadcast standards

3. PROJECT MANAGEMENT
   - Timeline and milestones
   - Resource allocation
   - Risk mitigation strategies
   - Quality assurance approach

4. EXPERIENCE & QUALIFICATIONS
   - Relevant project experience
   - Team qualifications
   - Industry certifications
   - Client references

5. COST PROPOSAL
   - Itemized cost breakdown
   - Value engineering opportunities
   - Assumptions and dependencies
   - Payment terms

6. SUPPORT & MAINTENANCE
   - 24/7 support capabilities
   - Maintenance procedures
   - SLA commitments
   - Training and documentation

Ensure the response:
- Addresses all critical requirements identified in the analysis
- Demonstrates deep broadcast industry knowledge
- Shows understanding of operational challenges
- Provides specific, actionable solutions
- Maintains professional tone throughout
- Includes relevant technical details without being overwhelming

Length: Aim for a comprehensive response (2000-3000 words).
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert proposal writer for broadcast and media industry RFPs. Write comprehensive, professional responses that demonstrate technical expertise."
        },
        {
          role: "user",
          content: responsePrompt
        }
      ],
      temperature: 0.4,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;
    
    // Structure the response
    const response = {
      content: responseText,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: "gpt-3.5-turbo",
        basedOnAnalysis: analysis.title,
        documentsUsed: selectedDocuments?.length || 0,
        customInstructions: !!customInstructions,
        wordCount: responseText.split(/\s+/).length
      },
      sections: extractSections(responseText),
      analysis: analysis
    };
    
    console.log('Response generation completed successfully');
    return response;
    
  } catch (error) {
    console.error('Response generation error:', error);
    
    return {
      content: `
# RFP Response Generation Error

An error occurred while generating the automated response: ${error.message}

## Next Steps
1. Review the RFP analysis results
2. Use historical documents as reference
3. Create response manually using the provided template sections
4. Ensure all technical requirements are addressed

## Template Sections to Include:
- Executive Summary
- Technical Approach  
- Project Management
- Experience & Qualifications
- Cost Proposal
- Support & Maintenance

Please contact system administrator if this error persists.
      `,
      metadata: {
        generatedAt: new Date().toISOString(),
        error: true,
        errorMessage: error.message
      },
      sections: {
        "Executive Summary": "Error - manual completion required",
        "Technical Approach": "Error - manual completion required",
        "Project Management": "Error - manual completion required",
        "Experience & Qualifications": "Error - manual completion required",
        "Cost Proposal": "Error - manual completion required",
        "Support & Maintenance": "Error - manual completion required"
      },
      analysis: analysis
    };
  }
}

function extractSections(responseText) {
  const sections = {};
  
  // Try to identify section headers and extract content
  const sectionRegex = /(?:^|\n)\s*(?:\d+\.\s*)?([A-Z\s&]{2,})\s*\n([\s\S]*?)(?=(?:\n\s*(?:\d+\.\s*)?[A-Z\s&]{2,}\s*\n)|$)/g;
  
  let match;
  while ((match = sectionRegex.exec(responseText)) !== null) {
    const [, title, content] = match;
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    
    if (cleanTitle.length > 0 && cleanContent.length > 0) {
      sections[cleanTitle] = cleanContent;
    }
  }
  
  // Fallback: if no sections found, create a single section
  if (Object.keys(sections).length === 0) {
    sections["Complete Response"] = responseText;
  }
  
  return sections;
}

export async function enhanceResponse(originalResponse, enhancementInstructions) {
  try {
    console.log('Enhancing existing response...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const enhancePrompt = `
Please enhance the following RFP response based on these instructions:

Enhancement Instructions:
${enhancementInstructions}

Original Response:
${originalResponse.content}

Please provide an improved version that:
- Addresses the enhancement instructions
- Maintains the professional tone
- Preserves all critical technical information
- Improves clarity and persuasiveness
- Ensures broadcast industry expertise is evident
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert editor improving broadcast industry RFP responses. Maintain technical accuracy while improving clarity and persuasiveness."
        },
        {
          role: "user", 
          content: enhancePrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const enhancedText = completion.choices[0].message.content;
    
    return {
      content: enhancedText,
      metadata: {
        enhancedAt: new Date().toISOString(),
        model: "gpt-3.5-turbo",
        enhancementInstructions,
        originalWordCount: originalResponse.content.split(/\s+/).length,
        enhancedWordCount: enhancedText.split(/\s+/).length
      },
      sections: extractSections(enhancedText),
      original: originalResponse
    };
    
  } catch (error) {
    console.error('Response enhancement error:', error);
    throw error;
  }
}