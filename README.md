# MasYun Data Analyzer

A sophisticated AI-powered data analysis platform with a futuristic space-themed interface, featuring comprehensive data processing, visualization, and route planning capabilities.

## 🚀 Features

### Core Data Analysis
- **Data Upload & Processing**: Support for CSV, JSON, Excel files with drag-and-drop interface
- **Interactive Data Explorer**: Advanced filtering, sorting, conditional formatting, and row selection
- **Statistical Analysis**: Automated profiling with AI-powered insights
- **Pivot Tables**: Drag-and-drop pivot table creation with multiple aggregation options
- **Data Visualization**: Interactive charts (Bar, Line, Pie, Area, Scatter, Radar) with customizable themes

### AI-Powered Features
- **AI Assistant**: Multimodal chat with Gemini API integration, image analysis, and web search
- **Advanced AI Tools**: Automated insight generation, predictive modeling suggestions, anomaly detection
- **AI Documentation Generator**: Automatic user manual generation
- **Route Analysis**: AI-powered route planning with traffic and terrain insights

### Route Planning System
- **Manual Route Input**: Point-to-point route calculation with multiple travel modes
- **Bulk Route Processing**: Excel file upload for mass route calculations
- **Enhanced Geocoding**: Automatic address resolution and nearest location finding
- **Travel Mode Support**: Driving, walking, and cycling with realistic duration estimates
- **AI Route Analysis**: Contextual insights for each route including traffic patterns and travel tips

### Visualization & Interface
- **3D Space Background**: Animated solar system with customizable themes
- **Holographic UI**: Futuristic panels with glassmorphism effects
- **macOS-style Dock**: Quick navigation with smooth animations
- **Diagramming Matrix**: Interactive diagram creation and editing
- **Responsive Design**: Optimized for desktop and mobile devices

### Data Management
- **Multiple File Formats**: CSV, JSON, XLS, XLSX, XLSB support
- **Cloud Storage Integration**: Planned support for Google Drive, Dropbox, OneDrive
- **Export Capabilities**: Multiple export formats with AI-generated reports
- **Data Validation**: Automatic type detection and error handling

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini API for text generation and analysis
- **Data Processing**: XLSX.js for Excel files, custom CSV/JSON parsers
- **Visualization**: Recharts for interactive charts
- **3D Graphics**: Three.js for background animations
- **Build Tool**: Vite for fast development and building

## 📋 Prerequisites

- Node.js (v18 or higher)
- Gemini API Key from Google AI Studio

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/masyun-data-analyzer.git
   cd masyun-data-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### API Setup
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your `.env.local` file
3. The application will automatically use the API for AI features

### Theme Customization
The application supports multiple themes with customizable accent colors. Themes can be modified in the `constants.tsx` file.

## 📖 Usage Guide

### Data Upload
1. Navigate to the "Upload Data" section
2. Drag and drop your file or click to select
3. For Excel files, choose the sheet to import
4. Data will be automatically parsed and validated

### Route Planning
1. Go to the "Route Planner" section
2. **Manual Input**: Enter start and end locations with travel mode
3. **Bulk Processing**: Upload Excel file with route data
4. Get distance calculations and AI-powered route analysis

### AI Assistant
1. Click the AI chat button in the bottom right
2. Ask questions about your data or upload images for analysis
3. The AI can generate code, documents, and provide insights

### Data Visualization
1. Upload your data first
2. Navigate to "Visualizations"
3. Drag fields to create custom charts
4. Customize colors, themes, and chart types

## 🔍 API Integration

### Gemini AI Features
- **Text Generation**: Automated insights and documentation
- **Geocoding**: Address to coordinates conversion
- **Route Analysis**: Travel recommendations and insights
- **Data Analysis**: Statistical summaries and pattern detection

### Rate Limiting
The application includes automatic retry mechanisms with exponential backoff to handle API rate limits gracefully.

## 🎨 UI Components

### Futuristic Design Elements
- **Holographic Panels**: Semi-transparent backgrounds with blur effects
- **Animated Background**: 3D solar system with orbiting planets
- **Neon Accents**: Glowing borders and interactive elements
- **Smooth Animations**: Transitions and micro-interactions

### Navigation
- **Sidebar**: Collapsible navigation with keyboard shortcuts (Ctrl/Cmd + B)
- **Dock**: macOS-style quick access to main features
- **Breadcrumbs**: Context-aware navigation indicators

## 📊 Data Processing

### Supported Formats
- **CSV**: Comma-separated values with automatic delimiter detection
- **JSON**: Nested object support with array flattening
- **Excel**: Multi-sheet support with sheet selection
- **Real-time Processing**: Streaming data processing for large files

### Data Validation
- **Type Detection**: Automatic identification of numeric, date, and text columns
- **Error Handling**: Graceful handling of malformed data
- **Missing Value Detection**: Identification and handling of null/empty values

## 🔒 Security & Privacy

- **Client-side Processing**: Most data processing happens in the browser
- **API Key Security**: Environment variables for sensitive credentials
- **No Data Storage**: Files are processed locally without server storage
- **HTTPS Only**: Secure communication with external APIs

## 🚧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── views/          # Main application views
│   ├── shared/         # Reusable UI components
│   └── ...
├── contexts/           # React context providers
├── services/           # API and data processing services
├── types.ts           # TypeScript type definitions
├── constants.tsx      # Application constants
└── utils/             # Utility functions
```

### Adding New Features
1. Create components in the appropriate directory
2. Add route definitions to `types.ts`
3. Update navigation in `constants.tsx`
4. Implement the view in `App.tsx`

### Testing
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checks
```

## 📦 Building for Production

```bash
npm run build       # Build for production
npm run preview     # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful AI capabilities
- **React Team** for the excellent framework
- **Recharts** for beautiful data visualizations
- **Three.js** for 3D graphics capabilities
- **Tailwind CSS** for utility-first styling

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

## 🗺 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced machine learning integrations
- [ ] Mobile app development
- [ ] Cloud storage synchronization
- [ ] Advanced route optimization algorithms
- [ ] Multi-language support
- [ ] Plugin system for custom extensions

---

**MasYun Data Analyzer** - Transforming data analysis with AI-powered insights and futuristic design.