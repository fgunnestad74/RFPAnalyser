# Free AI Alternatives Setup

Your OpenAI quota has been exceeded. Here are FREE alternatives to get your RFP Analyzer working:

## 🚀 Option 1: Groq (Recommended - Fast & Free)

Groq offers free API access with very fast models.

### Setup Steps:
1. **Sign up**: Go to https://console.groq.com/
2. **Create account**: Free account, no credit card required
3. **Get API key**: Go to API Keys section and create a new key
4. **Add to .env**: Add this line to your `backend/.env` file:
   ```
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```
5. **Restart server**: The system will automatically use Groq

**Free Limits**: 14,400 requests/day - More than enough for RFP analysis!

---

## 🏠 Option 2: Ollama (Completely Free - Local Models)

Run AI models locally on your computer - no API limits!

### Setup Steps:
1. **Install Ollama**: 
   - Mac: `brew install ollama` or download from https://ollama.ai
   - Windows/Linux: Download from https://ollama.ai
2. **Start Ollama**: Run `ollama serve` in terminal
3. **Download a model**: Run `ollama pull llama3`
4. **Restart RFP server**: It will auto-detect Ollama

**Benefits**: 
- ✅ Completely free
- ✅ No internet required after setup
- ✅ No API limits
- ✅ Privacy - your documents stay local

---

## 🤗 Option 3: Hugging Face (Free Tier)

Free API with various open-source models.

### Setup Steps:
1. **Sign up**: Go to https://huggingface.co/
2. **Get token**: Go to Settings → Access Tokens → Create new token
3. **Add to .env**: Add this line to your `backend/.env` file:
   ```
   HUGGINGFACE_API_KEY=hf_your_token_here
   ```
4. **Restart server**: The system will detect Hugging Face

---

## 🔄 How the System Works

The RFP Analyzer automatically:
1. **Detects available providers** when starting
2. **Prioritizes free options** (Ollama → Groq → Hugging Face → OpenAI)
3. **Falls back automatically** if one provider fails
4. **Shows provider status** in the UI

## 🎯 Recommended Quick Start

**For immediate use**: Set up Groq (5 minutes, no installation)
**For long-term use**: Install Ollama (10 minutes, but unlimited usage)

## 📊 Performance Comparison

| Provider | Speed | Quality | Cost | Setup Time |
|----------|-------|---------|------|------------|
| Groq | ⚡⚡⚡ | ⭐⭐⭐⭐ | 🆓 | 5 min |
| Ollama | ⚡⚡ | ⭐⭐⭐⭐ | 🆓 | 10 min |
| Hugging Face | ⚡ | ⭐⭐⭐ | 🆓 | 5 min |
| OpenAI | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰 | Already done |

All options provide good quality RFP analysis suitable for professional use!