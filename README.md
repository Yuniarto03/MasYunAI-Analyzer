# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Set environment variable: `vercel env add VITE_GEMINI_API_KEY`
4. Deploy: `vercel --prod`

## New Features

### Enhanced AI Assistant
- **PDF Support**: Upload and analyze PDF documents with advanced text extraction
- **Quantum AI Modes**: 6 specialized AI modes for different types of analysis
  - Creative Synthesis
  - Deep Analysis  
  - Strategic Planning
  - Research Mode
  - Problem Solver
  - Predictive Analysis
- **Multi-file Support**: Process multiple files simultaneously
- **Advanced File Processing**: Support for images, PDFs, text files, and Excel documents

### Quantum AI Capabilities
- **Multi-dimensional Analysis**: Advanced pattern recognition and insight generation
- **Strategic Thinking**: Long-term planning and scenario analysis
- **Creative Problem Solving**: Innovative solutions and breakthrough thinking
- **Predictive Analytics**: Trend analysis and future scenario modeling

### Vercel Deployment Ready
- Optimized build configuration for Vercel
- Environment variable handling for production
- PDF.js worker configuration for browser compatibility
- Proper CORS headers for secure operation