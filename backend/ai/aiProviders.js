import OpenAI from 'openai';
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// AI Provider configurations
const providers = {
  anthropic: {
    name: 'Anthropic Claude',
    available: !!process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    cost: 'paid_premium'
  },
  xai: {
    name: 'xAI Grok',
    available: !!process.env.XAI_API_KEY,
    models: ['grok-beta', 'grok-vision-beta'],
    cost: 'paid_alternative'
  },
  openai: {
    name: 'OpenAI',
    available: !!process.env.OPENAI_API_KEY,
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    cost: 'paid'
  },
  groq: {
    name: 'Groq',
    available: !!process.env.GROQ_API_KEY,
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    cost: 'free_tier'
  },
  ollama: {
    name: 'Ollama (Local)',
    available: false, // Will check at runtime
    models: ['llama3', 'mistral', 'codellama', 'phi3'],
    cost: 'free_local'
  },
  huggingface: {
    name: 'Hugging Face',
    available: !!process.env.HUGGINGFACE_API_KEY,
    models: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
    cost: 'free_tier'
  }
};

// Initialize clients
let anthropicClient = null;
let openaiClient = null;
let groqClient = null;
let xaiClient = null;

if (providers.anthropic.available) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

if (providers.openai.available) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

if (providers.groq.available) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

if (providers.xai.available) {
  // xAI uses OpenAI-compatible API
  xaiClient = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

// Check Ollama availability
async function checkOllamaAvailability() {
  try {
    const response = await axios.get('http://localhost:11434/api/version', { timeout: 2000 });
    providers.ollama.available = !!response.data;
    return true;
  } catch (error) {
    providers.ollama.available = false;
    return false;
  }
}

// Get available providers
export function getAvailableProviders() {
  return Object.entries(providers)
    .filter(([key, provider]) => provider.available)
    .map(([key, provider]) => ({ key, ...provider }));
}

// Get best available provider (prioritize working alternatives to OpenAI)
export function getBestProvider() {
  // Priority: Claude (excellent for analysis) > Alternative paid APIs > Free local > Free API > OpenAI
  if (providers.anthropic.available) return 'anthropic';
  if (providers.xai.available) return 'xai';
  if (providers.ollama.available) return 'ollama';
  if (providers.groq.available) return 'groq';
  if (providers.huggingface.available) return 'huggingface';
  if (providers.openai.available) return 'openai';
  return null;
}

// Anthropic Claude provider
async function analyzeWithAnthropic(content, prompt, model = "claude-3-5-sonnet-20241022") {
  if (!anthropicClient) throw new Error('Anthropic not configured');
  
  const completion = await anthropicClient.messages.create({
    model: model,
    max_tokens: 4000,
    temperature: 0.3,
    system: "You are an expert RFP analyst specializing in broadcast and media industry projects. Always respond with valid JSON.",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });
  
  return {
    content: completion.content[0].text,
    provider: 'anthropic',
    model: model,
    usage: completion.usage
  };
}

// xAI Grok provider
async function analyzeWithXAI(content, prompt) {
  if (!xaiClient) throw new Error('xAI not configured');
  
  const completion = await xaiClient.chat.completions.create({
    model: "grok-beta",
    messages: [
      {
        role: "system",
        content: "You are an expert RFP analyst specializing in broadcast and media industry projects. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  
  return {
    content: completion.choices[0].message.content,
    provider: 'xai',
    model: 'grok-beta',
    usage: completion.usage
  };
}

// OpenAI provider
async function analyzeWithOpenAI(content, prompt) {
  if (!openaiClient) throw new Error('OpenAI not configured');
  
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are an expert RFP analyst specializing in broadcast and media industry projects. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  
  return {
    content: completion.choices[0].message.content,
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    usage: completion.usage
  };
}

// Groq provider (fast and free tier available)
async function analyzeWithGroq(content, prompt) {
  if (!groqClient) throw new Error('Groq not configured');
  
  const completion = await groqClient.chat.completions.create({
    model: "llama3-8b-8192", // Fast and good model
    messages: [
      {
        role: "system",
        content: "You are an expert RFP analyst specializing in broadcast and media industry projects. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  
  return {
    content: completion.choices[0].message.content,
    provider: 'groq',
    model: 'llama3-8b-8192',
    usage: completion.usage
  };
}

// Ollama provider (local models)
async function analyzeWithOllama(content, prompt) {
  // Check if Ollama is running
  await checkOllamaAvailability();
  if (!providers.ollama.available) {
    throw new Error('Ollama not available. Please install and run Ollama locally.');
  }
  
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama3', // Default model
    prompt: `${prompt}\n\nDocument content: ${content.substring(0, 3000)}`,
    stream: false,
    options: {
      temperature: 0.3,
      num_predict: 2000
    }
  });
  
  return {
    content: response.data.response,
    provider: 'ollama',
    model: 'llama3',
    usage: { total_tokens: 0 } // Ollama doesn't provide usage stats
  };
}

// Hugging Face provider
async function analyzeWithHuggingFace(content, prompt) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }
  
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
    {
      inputs: prompt.substring(0, 1000), // HF has input limits
      parameters: {
        max_length: 500,
        temperature: 0.3
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    content: response.data[0]?.generated_text || 'Analysis completed with limited functionality',
    provider: 'huggingface',
    model: 'DialoGPT-large',
    usage: { total_tokens: 0 }
  };
}

// Main analysis function with provider fallback
export async function analyzeWithAI(content, prompt, preferredProvider = null, preferredModel = null) {
  const provider = preferredProvider || getBestProvider();
  
  if (!provider) {
    throw new Error('No AI providers available. Please configure OpenAI, Groq, or install Ollama.');
  }
  
  console.log(`Using AI provider: ${provider}`);
  
  try {
    switch (provider) {
      case 'anthropic':
        return await analyzeWithAnthropic(content, prompt, preferredModel);
      case 'xai':
        return await analyzeWithXAI(content, prompt);
      case 'openai':
        return await analyzeWithOpenAI(content, prompt);
      case 'groq':
        return await analyzeWithGroq(content, prompt);
      case 'ollama':
        return await analyzeWithOllama(content, prompt);
      case 'huggingface':
        return await analyzeWithHuggingFace(content, prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Analysis failed with ${provider}:`, error.message);
    
    // Try fallback to next available provider
    const available = getAvailableProviders().filter(p => p.key !== provider);
    if (available.length > 0) {
      console.log(`Trying fallback provider: ${available[0].key}`);
      return await analyzeWithAI(content, prompt, available[0].key);
    }
    
    throw error;
  }
}

// Initialize and check all providers
export async function initializeProviders() {
  console.log('Checking AI provider availability...');
  
  // Check Ollama
  await checkOllamaAvailability();
  
  const available = getAvailableProviders();
  console.log('Available AI providers:', available.map(p => `${p.name} (${p.cost})`));
  
  return {
    available,
    recommended: getBestProvider(),
    total: available.length
  };
}