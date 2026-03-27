import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Copy, Check, Play, Image as ImageIcon, FileText, Settings, Sparkles, Dices, Calendar, Download, Twitter, Facebook, MessageCircle, Send, Share2 } from 'lucide-react';
import { generateVideoContent, GeneratedContent, generateThumbnailImage } from './lib/gemini';

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

const getParametersForDay = (d: number) => {
  return {
    videoType: VIDEO_TYPES[(d - 1) % VIDEO_TYPES.length],
    topic: TOPICS[(d - 1) % TOPICS.length],
    hook: HOOKS[(d - 1) % HOOKS.length]
  };
};

export default function App() {
  const [day, setDay] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const d = parseInt(params.get('day') || '1');
    return d >= 1 && d <= 365 ? d : 1;
  });
  const [videoType, setVideoType] = useState(VIDEO_TYPES[0]);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [hook, setHook] = useState(HOOKS[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'image' | 'video' | 'thumbnail' | 'calendar'>('calendar');
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Update URL when day changes
  React.useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('day', day.toString());
    window.history.replaceState({}, '', url.toString());
  }, [day]);

  // Handle initial load with day parameter
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('day')) {
      const d = parseInt(params.get('day') || '1');
      if (d >= 1 && d <= 365) {
        handleGenerate(d);
      }
    }
  }, []);

  const handleGenerate = async (targetDay?: number) => {
    const d = targetDay || day;
    const params = getParametersForDay(d);
    
    // If generating from calendar, update the state to match
    if (targetDay) {
      setDay(d);
      setVideoType(params.videoType);
      setTopic(params.topic);
      setHook(params.hook);
    }

    setIsGenerating(true);
    setThumbnailImage(null);
    setError(null);
    try {
      const result = await generateVideoContent(d, params.videoType, params.topic, params.hook);
      setContent(result);
      setActiveTab('script');
      
      // Generate thumbnail image in the background
      setIsGeneratingThumbnail(true);
      try {
        const imageUrl = await generateThumbnailImage(result.thumbnail.backgroundPrompt);
        setThumbnailImage(imageUrl);
      } catch (thumbnailErr) {
        console.error("Thumbnail generation failed:", thumbnailErr);
      } finally {
        setIsGeneratingThumbnail(false);
      }
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

  const ShareMenu = ({ title, text }: { title: string; text: string }) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?day=${day}`;
    const shareLinks = [
      {
        name: 'Twitter',
        icon: <Twitter className="w-4 h-4" />,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.substring(0, 200) + '...')}&url=${encodeURIComponent(url)}`,
        color: 'hover:bg-sky-50 hover:text-sky-600'
      },
      {
        name: 'Facebook',
        icon: <Facebook className="w-4 h-4" />,
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        color: 'hover:bg-blue-50 hover:text-blue-600'
      },
      {
        name: 'WhatsApp',
        icon: <MessageCircle className="w-4 h-4" />,
        url: `https://wa.me/?text=${encodeURIComponent(text.substring(0, 500) + '\n\nRead more: ' + url)}`,
        color: 'hover:bg-emerald-50 hover:text-emerald-600'
      },
      {
        name: 'Telegram',
        icon: <Send className="w-4 h-4" />,
        url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text.substring(0, 500))}`,
        color: 'hover:bg-blue-50 hover:text-blue-500'
      }
    ];

    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 hidden sm:inline">Share</span>
        <div className="flex items-center gap-1">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-all text-slate-400 ${link.color}`}
              title={`Share on ${link.name}`}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    );
  };

  const downloadPlanCSV = () => {
    const headers = ['Day', 'Video Type', 'Topic', 'Hook Style'];
    const rows = Array.from({ length: 365 }, (_, i) => {
      const d = i + 1;
      const params = getParametersForDay(d);
      return [d, params.videoType, params.topic, params.hook.replace(/"/g, '""')];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'divine_365_day_plan.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCalendar = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">365-Day Content Calendar</h2>
            <p className="text-slate-500 text-sm">Automatically rotated topics and emotional angles for the entire year.</p>
          </div>
          <button
            onClick={downloadPlanCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm w-fit"
          >
            <Download className="w-4 h-4" />
            Download Plan (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 365 }, (_, i) => i + 1).map((d) => {
            const params = getParametersForDay(d);
            const isCurrent = day === d;
            
            return (
              <div 
                key={d} 
                className={`p-4 rounded-xl border transition-all group ${
                  isCurrent 
                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {d}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Day</span>
                  </div>
                  <button
                    onClick={() => handleGenerate(d)}
                    disabled={isGenerating}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                  >
                    Generate
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    <span className="text-xs font-semibold text-slate-700">{params.videoType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-xs font-medium text-slate-600">{params.topic}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {params.hook}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScript = () => {
    if (!content) return null;
    const { script } = content;
    const textToCopy = `Title: ${script.title}\nSEO Title: ${script.seoTitle}\n\nScript:\n${script.content.map(c => `(${c.timestamp})\n"${c.text}"`).join('\n\n')}\n\nVoice Tone: ${script.voiceTone}\nCTA: ${script.cta}\nHashtags: ${script.hashtags}`;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{script.title}</h2>
            <div className="flex flex-wrap gap-2">
              <div className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Viral Title
              </div>
              <div className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 flex items-center gap-2">
                {script.seoTitle}
                <button 
                  onClick={() => copyToClipboard(script.seoTitle, 'seo-title')}
                  className="p-1 hover:bg-indigo-100 rounded transition-colors"
                  title="Copy Viral Title"
                >
                  {copied === 'seo-title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShareMenu title={script.title} text={`Check out this viral Jesus video script: "${script.seoTitle}"\n\n${script.content[0].text}...`} />
            <button 
              onClick={() => copyToClipboard(textToCopy, 'script')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {copied === 'script' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied === 'script' ? 'Copied!' : 'Copy All'}
            </button>
          </div>
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
          <div className="flex items-center gap-4">
            <ShareMenu title="Image Prompts" text={`Viral Image Prompts for Day ${day}:\n\n${content.imagePrompts[0].setting}...`} />
            <button 
              onClick={() => copyToClipboard(textToCopy, 'image')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {copied === 'image' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
          </div>
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
          <div className="flex items-center gap-4">
            <ShareMenu title="Video Prompts" text={`Viral Video Prompts for Day ${day}:\n\n${content.videoPrompts[0].action}...`} />
            <button 
              onClick={() => copyToClipboard(textToCopy, 'video')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {copied === 'video' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
          </div>
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

  const renderThumbnail = () => {
    if (!content) return null;
    const { thumbnail } = content;
    const textToCopy = `Background Prompt: ${thumbnail.backgroundPrompt}\nOverlay Text: ${thumbnail.overlayText}\nColor Palette: ${thumbnail.colorPalette.join(', ')}\nDesign Notes: ${thumbnail.designNotes}`;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Viral Thumbnail Design</h2>
          <div className="flex items-center gap-4">
            <ShareMenu title="Thumbnail Design" text={`Check out my viral thumbnail design for Day ${day}!\n\nTitle: ${content.script.seoTitle}\nText: ${thumbnail.overlayText}`} />
            <button 
              onClick={() => copyToClipboard(textToCopy, 'thumbnail')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {copied === 'thumbnail' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              Copy Design Info
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visual Preview */}
          <div className="space-y-4">
            <div className="relative aspect-[9/16] bg-slate-200 rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-[300px] mx-auto group">
              {thumbnailImage ? (
                <>
                  <img 
                    src={thumbnailImage} 
                    alt="Thumbnail Background" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <h3 
                      className="text-3xl font-black uppercase tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                      style={{ color: thumbnail.colorPalette[0] || '#FFFFFF' }}
                    >
                      {thumbnail.overlayText}
                    </h3>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                  {isGeneratingThumbnail ? (
                    <>
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                      <p className="text-sm font-bold text-slate-600">Generating Background...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-slate-400 mb-4" />
                      <p className="text-sm text-slate-500">Background failed to load</p>
                    </>
                  )}
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                <p className="text-[10px] text-white/80 font-medium leading-tight">
                  Preview: Background + Overlay Text
                </p>
                {thumbnailImage && (
                  <button
                    onClick={() => {
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      img.crossOrigin = "anonymous";
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        if (ctx) {
                          // Draw background
                          ctx.drawImage(img, 0, 0);
                          
                          // Draw text overlay
                          const fontSize = Math.floor(canvas.width * 0.1);
                          ctx.font = `900 ${fontSize}px sans-serif`;
                          ctx.fillStyle = thumbnail.colorPalette[0] || '#FFFFFF';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.shadowColor = 'rgba(0,0,0,0.8)';
                          ctx.shadowBlur = 10;
                          ctx.shadowOffsetX = 0;
                          ctx.shadowOffsetY = 4;
                          
                          // Handle multi-line text if needed
                          const words = thumbnail.overlayText.toUpperCase().split(' ');
                          const lineHeight = fontSize * 1.1;
                          const startY = canvas.height / 2 - ((words.length - 1) * lineHeight) / 2;
                          
                          words.forEach((word, i) => {
                            ctx.fillText(word, canvas.width / 2, startY + (i * lineHeight));
                          });
                          
                          const link = document.createElement('a');
                          link.href = canvas.toDataURL('image/png');
                          link.download = `divine_thumbnail_day_${day}.png`;
                          link.click();
                        }
                      };
                      img.src = thumbnailImage;
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg transition-colors text-white"
                    title="Download Composed Thumbnail"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-slate-400 italic">
              * This is a mock-up. Use the background prompt in Midjourney for best results.
            </p>
          </div>

          {/* Design Details */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Viral SEO Title</h4>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-lg font-black text-indigo-900 leading-tight">
                  {content.script.seoTitle}
                </div>
                <p className="mt-2 text-[10px] text-slate-500 italic">
                  * Use this exact title on YouTube for maximum search visibility.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Background Prompt</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 font-mono leading-relaxed">
                  {thumbnail.backgroundPrompt}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overlay Text</h4>
                <div className="text-2xl font-black text-indigo-600 tracking-tight">
                  "{thumbnail.overlayText}"
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Viral Color Palette</h4>
                <div className="flex gap-3">
                  {thumbnail.colorPalette.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-inner border border-black/5" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-[10px] font-mono text-slate-500">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Design Strategy</h4>
                <div className="text-sm text-slate-600 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  {thumbnail.designNotes}
                </div>
              </div>
            </div>
          </div>
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">SEO Optimized Parameters</h2>
              <button 
                onClick={handleRandomize}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-md transition-colors"
              >
                <Dices className="w-3 h-3" />
                Randomize
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Hook & CTA Included</p>
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
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              365-Day Plan
            </button>
            <button
              onClick={() => setActiveTab('script')}
              disabled={!content}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={!content}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={!content}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'video' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Play className="w-4 h-4" />
              Video Prompts
            </button>
            <button
              onClick={() => setActiveTab('thumbnail')}
              disabled={!content}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'thumbnail' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Thumbnail
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'script' && content && renderScript()}
            {activeTab === 'image' && content && renderImagePrompts()}
            {activeTab === 'video' && content && renderVideoPrompts()}
            {activeTab === 'thumbnail' && content && renderThumbnail()}
            
            {activeTab !== 'calendar' && !content && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-medium text-slate-600 mb-2">No Content Generated</h2>
                <p className="max-w-md text-sm">Select a day from the calendar or use the manual controls to generate content.</p>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className="mt-6 text-indigo-600 font-semibold hover:underline"
                >
                  Back to Calendar
                </button>
              </div>
            )}
            
            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h2 className="text-xl font-medium text-slate-900">Generating Divine Content...</h2>
                <p className="text-slate-500 text-sm mt-2">Crafting your script, image prompts, and video scenes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
