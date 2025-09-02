import React, { useState } from 'react';
import { Upload, FileText, Brain, PenTool, Settings, FolderOpen, AlertCircle, CheckCircle, Users, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const RFPAnalyzer = () => {
  const [rfpFiles, setRfpFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [historicalDocs, setHistoricalDocs] = useState([]);
  const [responseText, setResponseText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [contentIds, setContentIds] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiProviders, setAiProviders] = useState([]);
  const [recommendedProvider, setRecommendedProvider] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [progressSteps, setProgressSteps] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState('');
  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  const [analysisResponseTime, setAnalysisResponseTime] = useState(null);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);

  // Check configuration status on component mount
  React.useEffect(() => {
    checkConfiguration();
  }, []);

  // Timer effect for live elapsed time during analysis
  React.useEffect(() => {
    let interval;
    if (isAnalyzing && analysisStartTime) {
      interval = setInterval(() => {
        setCurrentElapsedTime(Date.now() - analysisStartTime);
      }, 100); // Update every 100ms for smooth timer
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, analysisStartTime]);

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0.00s';
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
  };

  const checkConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE}/config`);
      const config = await response.json();
      
      setAiConfigured(config.aiConfigured);
      setAiProviders(config.aiProviders || []);
      setRecommendedProvider(config.recommendedProvider || '');
      
      if (config.aiProviders && config.aiProviders.length > 0) {
        const recommended = config.aiProviders.find(p => p.key === config.recommendedProvider) || config.aiProviders[0];
        setSelectedProvider(recommended.key);
        if (recommended.models && recommended.models.length > 0) {
          setSelectedModel(recommended.models[0]);
        }
      }
    } catch (error) {
      console.error('Configuration check failed:', error);
      setAiConfigured(false);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleMultipleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadStatus(`Uploading ${files.length} files...`);
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await fetch(`${API_BASE}/upload-multiple`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setRfpFiles(data.results);
        setContentIds(data.results.map(result => result.contentId));
        setUploadStatus(`Successfully uploaded ${data.processed} of ${files.length} files`);
        
        if (data.failed > 0) {
          setUploadStatus(prev => `${prev} (${data.failed} failed)`);
        }
      } else {
        setUploadStatus(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed: Network error');
    }
  };

  const analyzeRFP = async () => {
    if (!selectedProvider || !selectedModel || contentIds.length === 0) {
      alert('Please select an AI provider/model and upload documents first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStartTime(Date.now());
    setCurrentElapsedTime(0);
    setAnalysisProgress('Starting analysis...');
    setProgressSteps([
      { step: 'Initializing AI analysis', status: 'in_progress' },
      { step: 'Processing documents', status: 'pending' },
      { step: 'Generating comprehensive analysis', status: 'pending' },
      { step: 'Finalizing results', status: 'pending' }
    ]);

    try {
      // Update progress
      setProgressSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'completed' } :
        i === 1 ? { ...step, status: 'in_progress' } : step
      ));
      setAnalysisProgress('Processing documents...');

      let analysisResult;
      
      if (contentIds.length === 1) {
        // Single document analysis
        const response = await fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: contentIds[0],
            provider: selectedProvider,
            model: selectedModel
          }),
        });
        analysisResult = await response.json();
      } else {
        // Multiple document analysis
        const response = await fetch(`${API_BASE}/analyze-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentIds: contentIds,
            provider: selectedProvider,
            model: selectedModel
          }),
        });
        analysisResult = await response.json();
      }

      if (analysisResult.success) {
        setAnalysis(analysisResult.analysis);
        setComprehensiveAnalysis(analysisResult.analysis.comprehensiveAnalysis || '');
        
        // Update progress to completed
        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
        setAnalysisProgress('Analysis completed!');
        
        // Set response time
        const responseTime = Date.now() - analysisStartTime;
        setAnalysisResponseTime(responseTime);
        
        // Find historical documents based on analysis
        if (analysisResult.analysis) {
          findHistoricalDocuments(analysisResult.analysis);
        }
      } else {
        setAnalysisProgress(`Analysis failed: ${analysisResult.error}`);
        setProgressSteps(prev => prev.map(step => 
          step.status === 'in_progress' ? { ...step, status: 'error' } : step
        ));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisProgress(`Analysis failed: ${error.message}`);
      setProgressSteps(prev => prev.map(step => 
        step.status === 'in_progress' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim() || contentIds.length === 0) {
      alert('Please enter a question and make sure documents are uploaded');
      return;
    }

    setIsAnswering(true);
    setAiAnswer('');

    try {
      const response = await fetch(`${API_BASE}/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentIds[0], // Use first document for AI assistant
          question: aiQuestion,
          provider: selectedProvider,
          model: selectedModel
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiAnswer(data.answer);
      } else {
        setAiAnswer(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setAiAnswer(`Error: ${error.message}`);
    } finally {
      setIsAnswering(false);
    }
  };

  const findHistoricalDocuments = async (analysis) => {
    try {
      const response = await fetch(`${API_BASE}/find-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentIds[0],
          keywords: analysis.keyWords || []
        }),
      });

      const data = await response.json();
      if (data.success) {
        setHistoricalDocs(data.documents || []);
      }
    } catch (error) {
      console.error('Find documents error:', error);
    }
  };

  const generateResponse = async () => {
    if (!analysis) return;

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentIds[0],
          selectedDocuments: historicalDocs.map(doc => doc.id),
          customInstructions: ''
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResponseText(data.response.content);
      }
    } catch (error) {
      console.error('Response generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            RFP Analysis & Response System
          </h1>
          <p className="text-slate-300 text-lg">
            AI-powered RFP analysis for broadcast and media industry
          </p>
        </div>

        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className={`p-4 rounded-lg border ${aiConfigured ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
            <div className="flex items-center gap-2">
              {aiConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="font-medium">AI Configuration</span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              {aiConfigured ? `Ready (${aiProviders.length} providers)` : 'Not configured - add API keys'}
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-blue-900/30 border-blue-500/50">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Analysis Engine</span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              Multi-provider AI analysis ready
            </p>
          </div>
        </div>

        {/* AI Provider Selection */}
        {aiConfigured && aiProviders.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              AI Provider & Model Selection
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">AI Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    const provider = aiProviders.find(p => p.key === e.target.value);
                    if (provider && provider.models.length > 0) {
                      setSelectedModel(provider.models[0]);
                    }
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  {aiProviders.map(provider => (
                    <option key={provider.key} value={provider.key}>
                      {provider.name} {provider.key === recommendedProvider ? '(Recommended)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  {aiProviders.find(p => p.key === selectedProvider)?.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  )) || []}
                </select>
              </div>
            </div>

            {selectedProvider && (
              <div className="mt-3 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <p className="text-sm text-blue-300">
                  ✨ Selected: <strong>{aiProviders.find(p => p.key === selectedProvider)?.name}</strong> → <strong>{selectedModel}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Document Upload */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                <Upload className="w-6 h-6 text-blue-400" />
                Upload RFP Documents
              </h2>
              
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.odt,.ods,.xlsx,.xls"
                  onChange={(e) => handleMultipleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg mb-2">Drop multiple files here or click to browse</p>
                  <p className="text-sm text-slate-400">
                    Supported: PDF, Word (.doc/.docx), Excel (.xlsx/.xls), OpenDocument (.odt/.ods)
                  </p>
                </label>
              </div>

              {uploadStatus && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                  <p className="text-sm text-blue-300">{uploadStatus}</p>
                </div>
              )}

              {rfpFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Uploaded Files ({rfpFiles.length})</h3>
                  <div className="space-y-2">
                    {rfpFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.originalFile}</p>
                          <p className="text-xs text-slate-400">{Math.round(file.size / 1024)} KB</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={analyzeRFP}
                    disabled={isAnalyzing || !aiConfigured}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Analyzing Documents...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Analyze {rfpFiles.length} Document{rfpFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {(isAnalyzing || analysisProgress) && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm font-medium text-blue-300">{analysisProgress}</span>
                </div>
                
                {progressSteps.length > 0 && (
                  <div className="space-y-2">
                    {progressSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : step.status === 'in_progress' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-500"></div>
                        )}
                        <span className={`${
                          step.status === 'completed' ? 'text-green-300' :
                          step.status === 'in_progress' ? 'text-blue-300' :
                          'text-slate-400'
                        }`}>
                          {step.step}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                  RFP Analysis Results
                </h2>

                {/* Show analysis metadata */}
                {analysis.analysisMetadata && (
                  <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <p className="text-sm text-blue-300">
                      Analysis completed using: {analysis.analysisMetadata.provider} ({analysis.analysisMetadata.model})
                    </p>
                    <p className="text-xs text-blue-400">
                      Processed: {analysis.analysisMetadata.wordCount || 'N/A'} words • 
                      {analysis.analysisMetadata.contentLength || 'N/A'} characters
                    </p>
                  </div>
                )}

                {/* Show multi-document analysis info */}
                {analysis.multiDocumentAnalysis && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <p className="text-sm text-green-300">
                      📊 Multi-Document Analysis: {analysis.multiDocumentAnalysis.documentCount} documents processed
                    </p>
                    <div className="mt-2 text-xs text-green-400">
                      {analysis.multiDocumentAnalysis.documents.map((doc, i) => (
                        <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 bg-green-800/50 rounded">
                          {doc.filename}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Basic Analysis Display */}
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {analysis.summary || 'No summary available'}
                    </p>
                  </div>

                  {analysis.keyWords && analysis.keyWords.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Terms</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyWords.slice(0, 10).map((keyword, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.technicalRequirements && analysis.technicalRequirements.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Technical Requirements</h3>
                      <div className="space-y-1">
                        {analysis.technicalRequirements.slice(0, 5).map((req, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-slate-300 text-sm">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comprehensive Analysis Output */}
            {analysis && comprehensiveAnalysis && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-green-400" />
                  Comprehensive RFP Analysis & Guidance
                </h2>
                
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Complete analysis covering comprehension, technical requirements, response strategy, and drafting guidance based on your RFP document.
                  </p>
                  
                  <textarea
                    value={comprehensiveAnalysis}
                    readOnly
                    rows={30}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-200 text-sm resize-none focus:outline-none focus:border-green-500"
                    style={{ fontFamily: 'Roboto, system-ui, -apple-system, sans-serif', fontWeight: '300' }}
                    placeholder="Comprehensive analysis will appear here after analyzing an RFP document..."
                  />
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigator.clipboard.writeText(comprehensiveAnalysis)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
                    >
                      📋 Copy Analysis
                    </button>
                    <button 
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([comprehensiveAnalysis], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = `${analysis.title || 'RFP_Analysis'}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm flex items-center gap-2"
                    >
                      💾 Download Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant */}
            {analysis && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-green-400" />
                  AI Assistant - Ask Questions
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Ask a question about the RFP:</label>
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="e.g., What are the key technical requirements?"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && askAI()}
                    />
                  </div>
                  
                  <button
                    onClick={askAI}
                    disabled={isAnswering || !aiQuestion.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isAnswering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Getting Answer...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Ask AI Assistant
                      </>
                    )}
                  </button>
                  
                  {aiAnswer && (
                    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-300">AI Response:</h4>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {aiAnswer}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Historical Documents Selection */}
            {historicalDocs.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-green-400" />
                  Relevant Historical Documents
                </h2>
                
                <div className="space-y-3">
                  {historicalDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{doc.name}</p>
                        <div className="flex gap-4 text-xs text-slate-400 mt-1">
                          <span>Relevance: {doc.relevance}%</span>
                          <span>Last used: {doc.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={generateResponse}
                  disabled={isGenerating}
                  className="mt-4 w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating Response...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      Generate RFP Response
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Response Editor */}
            {responseText && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <PenTool className="w-6 h-6 text-green-400" />
                  Generated Response
                </h2>
                
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-200 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                  placeholder="Generated RFP response will appear here..."
                />
                
                <div className="flex gap-3 mt-4">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                    Save Draft
                  </button>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">
                    Export to Word
                  </button>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm">
                    Share with Team
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Quick Stats & Tools */}
          <div className="space-y-6">
            
            {/* Response Time */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Analysis Timer
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Analysis:</span>
                  <span className={`font-mono ${isAnalyzing ? 'text-yellow-400' : 'text-slate-500'}`}>
                    {isAnalyzing ? formatTime(currentElapsedTime) : '--'}
                  </span>
                </div>
                
                {analysisResponseTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Analysis:</span>
                    <span className="font-mono text-green-400">
                      {formatTime(analysisResponseTime)}
                    </span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-slate-600">
                  <span className="text-xs text-slate-500">
                    Timer shows analysis duration in real-time
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPAnalyzer;