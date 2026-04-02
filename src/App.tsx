import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Gamepad2, Sparkles, Copy, Settings, ChevronRight, ChevronDown } from 'lucide-react'
import './index.css'

interface GeneratedPrompt {
  id: number;
  prompt: string;
}

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '')

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey)
  }, [apiKey])

  const [idea, setIdea] = useState('')
  const [targetAi, setTargetAi] = useState('SORA')
  const [style, setStyle] = useState('Cinematic')
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showConfig, setShowConfig] = useState(true)
  
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('INSERT COIN (API KEY) TO PLAY!')
      return
    }
    if (!idea.trim()) {
      setError('ENTER YOUR VIDEO IDEA TO PROCEED.')
      return
    }

    setError('')
    setIsGenerating(true)
    setGeneratedPrompts([])

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      // Define the specific model requested by user
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

      let targetSpecificInstructions = '';
      if (targetAi === 'SORA AI') {
        targetSpecificInstructions = `
CRITICAL INSTRUCTIONS FOR SORA AI:
1. Begin with a direct description of the overall scene or camera perspective (e.g., "A beautiful silhouette animation shows...", "Drone view of...").
2. Explicitly specify the camera movement or angle (e.g., "The camera moves through...", "A drone camera circles around...", "A close up view of...").
3. Use extremely detailed, atmospheric visual descriptions targeting lighting, weather, and color (e.g., "warm glowing neon", "golden light of the setting sun", "vivid colors", "damp and reflective").
4. Include precise cinematography and photography terms if applicable to the style (e.g., "cinematic 35mm film", "depth of field", "shot on 70mm", "tiltshift").
5. Describe the main subject's action and appearance vividly; focus on concrete visual and physical details progressing through the shot.
`;
      } else if (targetAi === 'VEO 3') {
        targetSpecificInstructions = `
CRITICAL INSTRUCTIONS FOR VEO 3:
1. Frame and Camera Movement: Specify the exact framing (e.g., "A medium shot frames...") and camera moves (e.g., "low-angle view", "pan across").
2. Texture and Lighting: Explicitly dictate visual textures (e.g., "Claymation", "worn-out VHS tape") and specific lighting setups (e.g., "spotlight in one area").
3. Hyper-Specific Character Details: Describe age, unique features, and exact clothing (e.g., "A woman in her twenties with wavy brown hair and light freckles").
4. World-Building & Atmosphere: Use evocative, sensory language to paint the environment's mood (e.g., "smoky jazz club at night", "iridescent moon-dust").
5. Exact Play-by-Play Action: For dynamic scenes, map out the precise sequence of events for the shot, leaving nothing to chance.
6. Dialogue Generation included: Veo 3 supports text-to-speech dialogue! If relevant to the prompt idea, include exact spoken quotes for the characters.
`;
      } else if (targetAi === 'Kling AI') {
        targetSpecificInstructions = `
CRITICAL INSTRUCTIONS FOR KLING AI:
Your generated prompt MUST STRICTLY follow this specific structural formula: 
[Subject] + [Subject Movement] + [Scene Description] + [Camera Language + Lighting + Atmosphere]

1. Subject & Description: Define the main focus (person, animal, object) and describe their physical details (clothes, skin texture, hairstyle, posture) using consecutive short sentences.
2. Subject Movement: Describe clear, logical, and direct actions that make sense for a 5-10 second video duration.
3. Scene Description: Specify the exact location (indoor, outdoor) and provide background details concisely to keep the model focused.
4. Camera Language: Explicitly include professional camera shot types (e.g., "medium shot", "low-angle", "aerial view", "bokeh effect").
5. Lighting: Use technical lighting terms to add emotional depth (e.g., "Tyndall effect", "ambient lighting", "interplay of light and shadow").
6. Atmosphere: Close out with the overarching mood (e.g., "cinematic movie-level color palette").
`;
      }

      const promptRequest = `
You are a master prompt engineer for text-to-video AI generators. 
Your task is to convert the following user idea into EXACTLY 5 DIFFERENT HIGH-QUALITY VARIATIONS of a professional prompt optimized for ${targetAi}.
The visual style requested is: ${style}.
${targetSpecificInstructions}

User Idea: ${idea}

Provide the response ONLY as a valid JSON array of objects, where each object has the format:
[
  { "id": 1, "prompt": "Detailed prompt variation 1..." },
  { "id": 2, "prompt": "Detailed prompt variation 2..." }
]
Do not include Markdown blocks like \`\`\`json, just return the raw JSON array.
      `

      const result = await model.generateContent(promptRequest)
      const response = await result.response
      const text = response.text()
      
      try {
        // Strip markdown backticks if AI still returns them
        const cleanedText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const jsonMatch = cleanedText.match(/\[.*\]/s);
        const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanedText);
        
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          throw new Error("Invalid format received");
        }
        setGeneratedPrompts(parsedData);
      } catch (parseErr) {
        console.error("AI returned non-JSON format:", text);
        setError("AI didn't return a valid JSON array. Please try again.");
      }
      
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'GAME OVER. ERROR COMMUNICATING WITH GEMINI API.')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (generatedPrompts.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [generatedPrompts])

  const copyToClipboard = (textToCopy: string, rowId: number) => {
    navigator.clipboard.writeText(textToCopy)
    const el = document.getElementById(`prompt-row-${rowId}`)
    if (el) {
      el.classList.add('flash')
      setTimeout(() => el.classList.remove('flash'), 300)
    }
  }

  return (
    <div className="crt">
      <div className="arcade-cabinet">
        <h1 className="arcade-title">
          <Gamepad2 size={40} style={{ verticalAlign: 'middle', marginRight: '15px' }} />
          P1: VIDEO PROMPT GEN
        </h1>

        <div style={{ marginBottom: '30px', transform: 'translateZ(20px)' }}>
          <div 
            className="d-flex justify-between align-center" 
            style={{ cursor: 'pointer', borderBottom: '2px solid var(--arcade-border)', paddingBottom: '10px' }}
            onClick={() => setShowConfig(!showConfig)}
          >
            <span className="arcade-label" style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
              <Settings size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> 
              SYSTEM CONFIG
            </span>
            <ChevronRight size={24} style={{ transform: showConfig ? 'rotate(90deg)' : 'none', transition: '0.3s', color: 'var(--arcade-secondary)' }} />
          </div>
          
          {showConfig && (
            <div className="mt-4" style={{ animation: 'float 2s ease-in-out infinite alternate' }}>
              <label className="arcade-label">API KEY (GEMINI)</label>
              <input 
                type="password" 
                className="arcade-input" 
                placeholder="Enter Gemini API Key..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              
              <label className="arcade-label">AI MODEL</label>
              <div className="arcade-input" style={{ opacity: 0.7, padding: '15px' }}>
                Gemini 3.1 Flash
              </div>
            </div>
          )}
        </div>

        <div className="grid-2">
          <div>
            <label className="arcade-label">TARGET ENGINE</label>
            <select 
              className="arcade-select"
              value={targetAi}
              onChange={(e) => setTargetAi(e.target.value)}
            >
              <option value="SORA AI">SORA AI</option>
              <option value="Kling AI">KLING AI</option>
              <option value="VEO 3">VEO 3</option>
            </select>
          </div>
          <div>
            <label className="arcade-label">VISUAL STYLE</label>
            <select 
              className="arcade-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="Cinematic, Photorealistic">CINEMATIC</option>
              <option value="Anime, Studio Ghibli">ANIME</option>
              <option value="3D Animation, Pixar rules">3D ANIMATION</option>
              <option value="Retro Pixel Art, 8-bit">RETRO PIXEL</option>
              <option value="Cyberpunk, Neon Lights">CYBERPUNK</option>
              <option value="Surrealism, Dreamlike">SURREALISM</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="arcade-label">SCENARIO CONCEPT</label>
          <textarea 
            className="arcade-textarea" 
            placeholder="Describe your video idea... e.g., A cyber dog riding a skateboard through a neon city."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          ></textarea>
        </div>

        {error && (
          <div style={{ color: 'var(--arcade-primary)', background: '#300', padding: '10px', border: '2px solid red', margin: '20px 0', fontFamily: 'VT323, monospace', fontSize: '1.2rem', textAlign: 'center' }}>
            [ERROR]: {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            className="arcade-btn" 
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{ fontSize: '1.2rem', padding: '20px 40px', width: '100%' }}
          >
            {isGenerating ? (
              <span>
                GENERATING 
                <span className="loading-indicator">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              </span>
            ) : (
              <span><Sparkles size={20} style={{ marginRight: '10px', verticalAlign: 'text-bottom' }} /> PRESS START</span>
            )}
          </button>
        </div>

        {generatedPrompts.length > 0 && (
          <div className="output-box" ref={bottomRef}>
            <div className="d-flex justify-between align-center mb-4">
              <span className="arcade-label" style={{ margin: 0 }}>MISSION SUCCESS (5 VARIATIONS COMPILED)</span>
            </div>
            
            <table className="pixel-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>NO</th>
                  <th style={{ width: '70%' }}>PROMPT</th>
                  <th style={{ width: '20%' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {generatedPrompts.map((p) => (
                  <tr key={p.id} id={`prompt-row-${p.id}`}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.id}</td>
                    <td>
                      <details className="prompt-details">
                        <summary className="prompt-summary">
                          <ChevronDown size={14} style={{ marginRight: '8px' }} /> 
                          Show Variation {p.id}
                        </summary>
                        <div className="prompt-expanded">
                          {p.prompt}
                        </div>
                      </details>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="arcade-btn secondary" style={{ padding: '8px 12px', marginTop: 0, fontSize: '0.8rem' }} onClick={() => copyToClipboard(p.prompt, p.id)}>
                        <Copy size={12} style={{ marginRight: '5px', verticalAlign: 'sub' }} /> SALIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        .flash {
          animation: flashBg 0.3s;
        }
        @keyframes flashBg {
          0% { background-color: rgba(0, 255, 0, 0.4); }
          100% { background-color: transparent; }
        }
        
        .pixel-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'VT323', monospace;
          font-size: 1.2rem;
          color: #0f0;
          background-color: #000;
          border: 2px solid #0f0;
        }
        
        .pixel-table th {
          font-family: 'Press Start 2P', cursive;
          font-size: 0.7rem;
          color: var(--arcade-primary);
          border-bottom: 2px solid #0f0;
          padding: 15px 10px;
          text-align: left;
          text-transform: uppercase;
        }
        
        .pixel-table td {
          border-bottom: 1px dashed #0f0;
          padding: 15px 10px;
          vertical-align: top;
        }
        
        .pixel-table tr:last-child td {
          border-bottom: none;
        }
        
        .prompt-details {
          cursor: pointer;
        }
        
        .prompt-summary {
          outline: none;
          font-weight: bold;
          color: var(--arcade-secondary);
          display: flex;
          align-items: center;
          user-select: none;
        }
        
        .prompt-expanded {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dotted #0f0;
          white-space: pre-wrap;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}

export default App
