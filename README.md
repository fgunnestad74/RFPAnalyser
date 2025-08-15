# RFP Analyzer - AI-Powered RFP Analysis & Response System

A comprehensive solution for analyzing Request for Proposal (RFP) documents and generating professional responses, specifically designed for the broadcast and media industry.

## Features

- **Multi-format Document Parsing**: Support for PDF, Word (.doc/.docx), Excel (.xlsx/.xls), and ODF (.odt/.ods) files
- **AI-Powered Analysis**: Intelligent extraction of key requirements, risks, timelines, and opportunities
- **Historical Document Integration**: Google Drive integration for leveraging past proposals and responses
- **Smart Response Generation**: AI-generated professional RFP responses based on analysis and historical data
- **Industry-Specific Focus**: Tailored for broadcast and media industry requirements and standards
- **Team Collaboration**: Draft management, sharing, and export capabilities

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Node.js with Express
- File parsing libraries (mammoth, pdf-parse, xlsx, etc.)
- OpenAI GPT-4 for AI analysis and response generation
- Google Drive API for document management
- File-based storage system

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

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Drive API credentials (optional, for historical document integration)

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd rfp-analyzer

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Backend Configuration

```bash
# In the backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
nano .env
```

Required environment variables:
```env
# Essential
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001

# Optional (for Google Drive integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

### 3. Start the Application

```bash
# Start backend server (from backend directory)
npm run dev

# In a new terminal, start frontend (from frontend directory)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### Document Processing
- `POST /api/upload` - Upload and parse RFP document
- `POST /api/analyze` - Analyze uploaded document with AI
- `POST /api/find-documents` - Find relevant historical documents
- `POST /api/generate-response` - Generate RFP response

### System
- `GET /api/health` - Health check
- `GET /api/stats` - System statistics

## Usage

1. **Upload RFP Document**: Drag and drop or select an RFP file (PDF, Word, Excel, or ODF format)

2. **Configure APIs**: Set up OpenAI API key for analysis and optionally Google Drive for historical documents

3. **Analyze Document**: Click "Analyze RFP" to extract key information including:
   - Project requirements and scope
   - Budget and timeline information
   - Risk factors and challenges
   - Compliance requirements
   - Opportunity areas

4. **Review Results**: Examine the structured analysis results and identified risk factors

5. **Find Historical Documents**: System searches Google Drive for relevant past proposals and responses

6. **Generate Response**: Create a professional RFP response based on analysis and historical data

7. **Edit and Export**: Refine the generated response and export to Word or share with team

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

## Troubleshooting

### Common Issues

1. **Document parsing fails**
   - Ensure file format is supported
   - Check file isn't corrupted or password protected
   - Verify file size is under 50MB limit

2. **AI analysis returns errors**
   - Confirm OpenAI API key is valid and has credits
   - Check internet connectivity
   - Review API rate limits

3. **Google Drive integration issues**
   - Verify OAuth credentials are correct
   - Ensure refresh token hasn't expired
   - Check API quotas and permissions

4. **Frontend can't reach backend**
   - Confirm backend is running on port 3001
   - Check CORS configuration
   - Verify proxy settings in vite.config.ts

### Logs and Debugging

Backend logs are output to console. For debugging:
- Set `LOG_LEVEL=debug` in .env
- Check browser network tab for API calls
- Review file permissions for data directories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please create an issue in the project repository.

---

**Note**: This system is designed for professional RFP analysis in the broadcast and media industry. Ensure you have proper API keys and credentials configured before use.