# RFP Analyzer - AI-Powered RFP Analysis & Response System

A comprehensive solution for analyzing Request for Proposal (RFP) documents and generating professional responses, specifically designed for the broadcast and media industry. The system supports multiple AI providers including free alternatives like Ollama and Groq.

## ✨ Key Features

- **📄 Multi-format Document Parsing**: Support for PDF, Word (.doc/.docx), Excel (.xlsx/.xls), and ODF (.odt/.ods) files
- **🤖 AI-Powered Analysis**: Intelligent extraction of key requirements, risks, timelines, and opportunities
- **🔗 Historical Document Integration**: Google Drive integration for leveraging past proposals and responses
- **📝 Smart Response Generation**: AI-generated professional RFP responses based on analysis and historical data
- **🎯 Industry-Specific Focus**: Tailored for broadcast and media industry requirements and standards
- **👥 Team Collaboration**: Draft management, sharing, and export capabilities
- **🆓 Multiple AI Providers**: Support for OpenAI, Groq, Anthropic, Hugging Face, and local Ollama models
- **⚡ Real-time Progress**: Live analysis progress tracking with elapsed time display
- **🔄 Comprehensive Analysis**: Multi-step analysis pipeline with detailed insights

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript for robust type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **Lucide React** for consistent iconography

### Backend
- **Node.js** with Express framework
- **File Parsing**: mammoth (Word), pdf-parse (PDF), xlsx (Excel), custom ODF parser
- **AI Integration**: OpenAI GPT-4, Anthropic Claude, Groq, Hugging Face, Ollama
- **Storage**: Google Drive API integration + local file-based storage
- **Security**: CORS, input validation, secure file handling

## Project Structure

```
rfp-analyzer/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── RFPAnalyzer.tsx  # Main component
│   │   ├── main.tsx         # Application entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Express backend server
│   ├── server.js            # Main server file
│   ├── parsers/             # Document parsing modules
│   │   ├── odfParser.js     # ODF document parser
│   │   ├── wordParser.js    # Word document parser
│   │   ├── excelParser.js   # Excel document parser
│   │   └── pdfParser.js     # PDF document parser
│   ├── ai/                  # AI analysis modules
│   │   ├── analyzer.js      # RFP analysis logic
│   │   └── responseGenerator.js # Response generation
│   ├── storage/             # Storage management
│   │   ├── fileManager.js   # Local file operations
│   │   └── googleDrive.js   # Google Drive integration
│   ├── data/                # Local storage directories
│   │   ├── processed/       # Parsed document content
│   │   ├── embeddings/      # Document embeddings
│   │   ├── cache/           # Temporary cache
│   │   ├── uploads/         # File uploads
│   │   ├── analysis/        # Analysis results
│   │   └── responses/       # Generated responses
│   ├── .env.example         # Environment variables template
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **AI Provider**: Choose one of the following:
  - 🆓 **Ollama** (recommended for free local AI) - [Setup Guide](INSTALL_OLLAMA.md)
  - 🆓 **Groq** (fast free API) - [Setup Guide](FREE_AI_SETUP.md)
  - 💰 **OpenAI** (paid API with GPT-4)
  - 💰 **Anthropic Claude** (paid API)
- **Google Drive** (optional) - [Setup Guide](GOOGLE_DRIVE_SETUP.md)

### 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd rfp-analyzer

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### ⚙️ Configuration

```bash
# Navigate to backend directory
cd backend

# Copy environment template (create if it doesn't exist)
cp .env.example .env || touch .env

# Edit .env file with your preferred AI provider
nano .env
```

**Environment Variables:**
```env
# Required - Server Configuration
PORT=3001

# AI Providers (choose one or more)
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Optional - Google Drive Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your_project_id
```

### 🏃‍♂️ Running the Application

```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

**Access the application:**
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3001

## 📚 API Reference

### Document Processing
- `POST /api/upload` - Upload and parse single RFP document
- `POST /api/upload-multiple` - Upload and parse multiple documents
- `POST /api/analyze` - Analyze uploaded document with AI
- `POST /api/comprehensive-analyze` - Perform comprehensive multi-step analysis
- `POST /api/find-documents` - Find relevant historical documents from Google Drive
- `POST /api/generate-response` - Generate professional RFP response
- `POST /api/ask-question` - Ask AI questions about analyzed documents

### System & Configuration
- `GET /api/health` - System health check
- `GET /api/config` - Get AI provider configuration and status
- `GET /api/stats` - System statistics and usage metrics

## 📋 Usage Guide

### 1. **📤 Upload Documents**
- Drag and drop or select RFP files (PDF, Word, Excel, ODF)
- Support for single or multiple document upload
- Real-time upload progress tracking

### 2. **🔧 Configure AI Provider**
- System automatically detects available AI providers
- Prioritizes free options (Ollama → Groq → Hugging Face → OpenAI)
- Shows provider status and recommendations in UI

### 3. **🔍 Analyze RFP**
- Click "Analyze RFP" for comprehensive document analysis
- Real-time progress tracking with elapsed time
- Extracts:
  - 📋 Project requirements and scope
  - 💰 Budget and timeline information
  - ⚠️ Risk factors and challenges
  - ✅ Compliance requirements
  - 🎯 Opportunity areas
  - 🏢 Industry-specific insights

### 4. **📊 Review Analysis Results**
- Structured analysis with key findings
- Risk assessment with severity levels
- Timeline and budget analysis
- Technical requirements breakdown

### 5. **🔍 Find Historical Context**
- Google Drive integration searches for relevant documents
- Similarity matching with uploaded RFP
- Historical proposal and response analysis

### 6. **📝 Generate Response**
- AI-powered response generation
- Based on analysis and historical data
- Industry-specific templates and formatting
- Broadcast and media focus

### 7. **💬 Interactive Q&A**
- Ask specific questions about the RFP
- Get targeted insights and clarifications
- Leverage full document context

## Industry-Specific Features

### Broadcast & Media Focus
- EBU and SMPTE standards recognition
- Broadcasting equipment terminology
- Live production workflow understanding
- 24/7 operational requirements analysis
- CDN and streaming infrastructure expertise
- Media asset management considerations

### Risk Analysis
- Technical compatibility assessment
- Timeline feasibility evaluation
- Resource requirement validation
- Compliance gap identification
- Integration complexity analysis

## Development

### Adding New Parsers

To support additional document formats, create a new parser in `backend/parsers/`:

```javascript
// backend/parsers/newFormatParser.js
export async function parse(filePath) {
  // Implement parsing logic
  return parsedContent;
}

export async function extractMetadata(filePath) {
  // Return format-specific metadata
  return metadata;
}
```

### Customizing AI Prompts

Modify the analysis prompts in `backend/ai/analyzer.js` to:
- Add industry-specific terminology
- Include custom evaluation criteria
- Adjust risk assessment parameters
- Enhance response generation templates

### Storage Configuration

The system uses file-based storage by default. Directory structure:
- `processed/` - Parsed document content as JSON
- `analysis/` - AI analysis results
- `responses/` - Generated RFP responses
- `cache/` - Temporary cached data
- `embeddings/` - Document similarity embeddings

## 🔧 Troubleshooting

### 🚨 Common Issues

#### **Document Processing**
- **Upload fails**: Check file format (PDF, Word, Excel, ODF), size (<50MB), not password protected
- **Parsing errors**: Ensure document isn't corrupted, try different format
- **Slow parsing**: Large files may take time, check progress indicators

#### **AI Analysis**
- **"No AI provider configured"**: Set up at least one AI provider in `.env`
- **API errors**: Check API keys, internet connectivity, rate limits
- **Slow analysis**: Switch to Groq for faster responses, or use local Ollama
- **Poor quality**: Try different AI provider, OpenAI/Claude typically give best results

#### **Google Drive Integration**
- **"Google Drive not configured"**: Follow [Google Drive Setup Guide](GOOGLE_DRIVE_SETUP.md)
- **"Permission denied"**: Share folders with service account email
- **"Folder not found"**: Verify folder ID format and permissions

#### **Frontend/Backend Connection**
- **"Cannot connect to server"**: Ensure backend is running on port 3001
- **CORS errors**: Check CORS configuration in server.js
- **404 errors**: Verify API endpoints are correctly defined

### 📊 Performance Issues
- **Slow analysis**: Use Groq or local Ollama for faster processing
- **Memory issues**: Restart backend, check large file uploads
- **Storage full**: Clean up `data/` directories periodically

### 🐛 Debugging

**Backend logs:**
```bash
# Enable debug logging
echo "LOG_LEVEL=debug" >> backend/.env

# Check server logs
cd backend && npm run dev
```

**Frontend debugging:**
- Open browser Developer Tools → Network tab
- Check API calls and responses
- Review console for JavaScript errors

**File permissions:**
```bash
# Ensure data directories are writable
chmod -R 755 backend/data/
```

## 🚀 AI Provider Comparison

| Provider | Cost | Speed | Quality | Setup | Best For |
|----------|------|-------|---------|-------|----------|
| **Ollama** | 🆓 Free | ⚡⚡ Fast | ⭐⭐⭐⭐ | 10 min | Privacy, unlimited use |
| **Groq** | 🆓 Free tier | ⚡⚡⚡ Very fast | ⭐⭐⭐⭐ | 5 min | Quick testing, speed |
| **OpenAI GPT-4** | 💰 Paid | ⚡⚡ Fast | ⭐⭐⭐⭐⭐ | 5 min | Best quality |
| **Anthropic Claude** | 💰 Paid | ⚡⚡ Fast | ⭐⭐⭐⭐⭐ | 5 min | Long documents |
| **Hugging Face** | 🆓 Free tier | ⚡ Moderate | ⭐⭐⭐ | 5 min | Open source models |

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add appropriate error handling
- Update documentation for new features
- Test with multiple AI providers when possible

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support & Community

- **Issues**: [GitHub Issues](../../issues) for bug reports and feature requests
- **Discussions**: [GitHub Discussions](../../discussions) for questions and community chat
- **Wiki**: [Project Wiki](../../wiki) for detailed documentation

## 🏆 Acknowledgments

- Built for the broadcast and media industry
- Supports multiple AI providers for accessibility
- Designed with privacy and local deployment in mind

---

**⚠️ Important**: This system is designed for professional RFP analysis in the broadcast and media industry. Always ensure you have proper API keys and credentials configured, and review AI-generated content before submitting proposals.