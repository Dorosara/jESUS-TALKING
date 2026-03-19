import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Copy, Check, Play, Image as ImageIcon, FileText, Settings, Sparkles, Dices } from 'lucide-react';
import { generateVideoContent, GeneratedContent } from './lib/gemini';

const VIDEO_TYPES = ['Pain / Fear', 'Hope / Healing', 'Command / Faith'];
const TOPICS = [
  'Money problems', 'Job stress', 'Anxiety', 'Health fear', 
  'Family issues', 'Loneliness', 'Failure', 'Addiction', 'Depression'
];
const HOOKS = [
  '"Don\'t scroll…"', '"This message is for you…"', 
  '"Jesus wants to tell you…"', '"This is your sign…"',
  '"Stop... this is not random."'
];

export default function App() {
  const [day, setDay] = useState(1);
  const [videoType, setVideoType] = useState(VIDEO_TYPES[0]);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [hook, setHook] = useState(HOOKS[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'image' | 'video'>('script');
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateVideoContent(day, videoType, topic, hook);
      setContent(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomize = () => {
    setVideoType(VIDEO_TYPES[Math.floor(Math.random() * VIDEO_TYPES.length)]);
    setTopic(TOPICS[Math.floor(Math.random() * TOPICS.length)]);
    setHook(HOOKS[Math.floor(Math.random() * HOOKS.length)]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderScript = () => {
    if (!content) return null;
    const { script } = content;
    const textToCopy = `Title: ${script.title}\n\nScript:\n${script.content.map(c => `(${c.timestamp})\n"${c.text}"`).join('\n\n')}\n\nVoice Tone: ${script.voiceTone}\nCTA: ${script.cta}\nHashtags: ${script.hashtags}`;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{script.title}</h2>
          <button 
            onClick={() => copyToClipboard(textToCopy, 'script')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            {copied === 'script' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied === 'script' ? 'Copied!' : 'Copy All'}
          </button>
        </div>

        <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {script.content.map((block, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="w-20 shrink-0 text-xs font-mono text-slate-400 pt-1">
                {block.timestamp}
              </div>
              <div className="text-lg text-slate-800 font-medium leading-relaxed border-l-2 border-indigo-100 pl-4 group-hover:border-indigo-400 transition-colors">
                "{block.text}"
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Voice Tone</div>
            <div className="text-slate-800">{script.voiceTone}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Call to Action</div>
            <div className="text-slate-800">{script.cta}</div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hashtags</div>
          <div className="text-slate-600 font-mono text-sm">{script.hashtags}</div>
        </div>
      </div>
    );
  };

  const renderImagePrompts = () => {
    if (!content) return null;
    const textToCopy = content.imagePrompts.map(p => `Scene ${p.scene}:\nSetting: ${p.setting}\nEmotion: ${p.emotion}\nCamera Angle: ${p.cameraAngle}\nLighting: ${p.lighting}`).join('\n\n');

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Midjourney / Image Prompts</h2>
          <button 
            onClick={() => copyToClipboard(textToCopy, 'image')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            {copied === 'image' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-4">
          {content.imagePrompts.map((prompt, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {prompt.scene}
                </div>
                Scene {prompt.scene}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><span className="font-semibold text-slate-500">Setting:</span> <span className="text-slate-800">{prompt.setting}</span></div>
                <div><span className="font-semibold text-slate-500">Emotion:</span> <span className="text-slate-800">{prompt.emotion}</span></div>
                <div><span className="font-semibold text-slate-500">Camera:</span> <span className="text-slate-800">{prompt.cameraAngle}</span></div>
                <div><span className="font-semibold text-slate-500">Lighting:</span> <span className="text-slate-800">{prompt.lighting}</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded">
                  /imagine prompt: Jesus, {prompt.setting}, {prompt.emotion} expression, {prompt.cameraAngle}, {prompt.lighting}, hyper-realistic, 4k, cinematic --ar 9:16
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVideoPrompts = () => {
    if (!content) return null;
    const textToCopy = content.videoPrompts.map(p => `Scene ${p.scene}:\nAction: ${p.action}\nCamera: ${p.cameraMovement}\nDialogue: "${p.dialogue}"\nEmotion: ${p.emotion}\nLighting: ${p.lightingTransition}`).join('\n\n');

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Veo 3 / Video Prompts</h2>
          <button 
            onClick={() => copyToClipboard(textToCopy, 'video')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            {copied === 'video' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-4">
          {content.videoPrompts.map((prompt, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {prompt.scene}
                </div>
                Scene {prompt.scene}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                <div className="col-span-1 md:col-span-2"><span className="font-semibold text-slate-500">Action:</span> <span className="text-slate-800">{prompt.action}</span></div>
                <div><span className="font-semibold text-slate-500">Camera:</span> <span className="text-slate-800">{prompt.cameraMovement}</span></div>
                <div><span className="font-semibold text-slate-500">Emotion:</span> <span className="text-slate-800">{prompt.emotion}</span></div>
                <div className="col-span-1 md:col-span-2"><span className="font-semibold text-slate-500">Lighting:</span> <span className="text-slate-800">{prompt.lightingTransition}</span></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Dialogue (Lip Sync)</div>
                <div className="text-emerald-900 font-medium">"{prompt.dialogue}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Divine Content</h1>
            <p className="text-xs text-slate-500">365-Day Video Engine</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parameters</h2>
            <button 
              onClick={handleRandomize}
              className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-md transition-colors"
            >
              <Dices className="w-3 h-3" />
              Randomize
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Day Number
            </label>
            <input 
              type="number" 
              min="1" 
              max="365" 
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Video Type (Emotion)</label>
            <select 
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
            >
              {VIDEO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Topic / Struggle</label>
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Hook Style</label>
            <select 
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
            >
              {HOOKS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Content
              </>
            )}
          </button>
          {error && (
            <p className="text-red-500 text-xs mt-3 text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {content ? (
          <div className="max-w-4xl mx-auto p-6 md:p-10">
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit">
              <button
                onClick={() => setActiveTab('script')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'script' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Script
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'image' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Image Prompts
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'video' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Play className="w-4 h-4" />
                Video Prompts
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'script' && renderScript()}
              {activeTab === 'image' && renderImagePrompts()}
              {activeTab === 'video' && renderVideoPrompts()}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-medium text-slate-600 mb-2">Ready to Generate</h2>
            <p className="max-w-md text-sm">Configure your video parameters in the sidebar and click generate to create a complete script, image prompts, and video prompts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
