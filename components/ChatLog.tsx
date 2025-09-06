
import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChartData } from '../types';
import { AppState } from '../types';
import SourceCitations from './SourceCitations';
import { DoubleCheckIcon } from './Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface ChatLogProps {
  history: ChatMessage[];
  appState: AppState;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-slate-700/80 text-slate-300 rounded-md hover:bg-slate-600/80 transition-all duration-200"
            aria-label="Copy code"
        >
            {isCopied ? (
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Copied!
                </span>
            ) : (
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy
                </span>
            )}
        </button>
    );
};

const ChartRenderer: React.FC<{ data: ChartData }> = ({ data }) => {
    const PADDING = { top: 40, right: 20, bottom: 50, left: 50 };
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 300;
    
    const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
    const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const maxValue = Math.max(0, ...data.datasets.flatMap(d => d.data));
    const yScale = chartHeight / (maxValue > 0 ? maxValue : 1);
    const barWidth = chartWidth / data.labels.length;

    const yTicks = 5;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
        const value = (maxValue / yTicks) * i;
        if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value > 1000) return `${(value / 1000).toFixed(0)}K`;
        return Math.round(value);
    });

    return (
        <div className="my-2 bg-black/20 p-2 rounded-lg border border-primary-t-20/50">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
                <title id="chart-title">{data.title}</title>
                <text x={SVG_WIDTH / 2} y={PADDING.top / 2} textAnchor="middle" className="font-orbitron fill-current text-text-secondary text-base">{data.title}</text>
                
                {/* Y-Axis and Grid Lines */}
                <g className="text-xs fill-current text-text-muted" transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                    {yTickValues.map((tick, i) => {
                        const y = chartHeight - (i * (chartHeight / yTicks));
                        return (
                            <g key={i}>
                                <text x={-8} y={y + 4} textAnchor="end">{tick}</text>
                                <line x1="0" y1={y} x2={chartWidth} y2={y} className="stroke-current text-primary-t-20 opacity-50" strokeWidth="0.5" />
                            </g>
                        );
                    })}
                </g>

                {/* Bars and X-Axis labels */}
                <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                    {data.labels.map((label, index) => {
                        const value = data.datasets[0].data[index] || 0;
                        const barHeight = value * yScale;
                        const x = index * barWidth;
                        const y = chartHeight - barHeight;

                        return (
                            <g key={index} className="group">
                                <rect 
                                    x={x + barWidth * 0.1} 
                                    y={y} 
                                    width={barWidth * 0.8} 
                                    height={barHeight} 
                                    className="fill-current text-primary-t-80 group-hover:text-primary transition-all duration-200"
                                >
                                  <title>{`${label}: ${value}`}</title>
                                </rect>
                                <text x={x + barWidth * 0.5} y={y - 5} textAnchor="middle" className="text-xs fill-current text-text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold">{value}</text>
                                <text x={x + barWidth * 0.5} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-current text-text-muted">{label}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

const tryParseJson = (text: string): any | null => {
    try {
        let jsonString = text.trim();
        
        const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1];
        } else {
            const firstBrace = jsonString.indexOf('{');
            const firstBracket = jsonString.indexOf('[');

            if (firstBrace === -1 && firstBracket === -1) {
                return null;
            }

            let startIndex = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
            jsonString = jsonString.substring(startIndex);
        }

        return JSON.parse(jsonString);

    } catch (e) {
        // Not valid JSON
    }
    return null;
};


export const FormattedMessage: React.FC<{ text: string }> = React.memo(({ text }) => {
    const parsedJson = tryParseJson(text);

    if (parsedJson) {
        if (parsedJson.action === 'conversational_response' && typeof parsedJson.text === 'string') {
            return <FormattedMessage text={parsedJson.text} />;
        }
        
        const prettyJson = JSON.stringify(parsedJson, null, 2);
        return (
            <div className="relative my-2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-700">
               <CopyButton textToCopy={prettyJson} />
               <SyntaxHighlighter
                    language={'json'}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', backgroundColor: 'transparent' }}
                    codeTagProps={{ style: { fontFamily: 'monospace' }}}
               >
                   {prettyJson.trimEnd()}
               </SyntaxHighlighter>
            </div>
        );
    }
    
    const renderInline = (line: string) => {
        const parts = line.split(/(`.*?`|\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-slate-700/50 text-text-secondary font-mono px-1.5 py-0.5 rounded-md text-sm">{part.slice(1, -1)}</code>;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');

    let inCodeBlock = false;
    let codeLang = '';
    let codeAccumulator = '';
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-2 space-y-1">
                    {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('```')) {
            flushList();
            if (inCodeBlock) {
                // End of code block
                elements.push(
                    <div key={`code-${elements.length}`} className="relative my-2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-700">
                       <CopyButton textToCopy={codeAccumulator} />
                       <SyntaxHighlighter
                            language={codeLang || 'text'}
                            style={vscDarkPlus}
                            showLineNumbers
                            customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', backgroundColor: 'transparent' }}
                            codeTagProps={{ style: { fontFamily: 'monospace' }}}
                       >
                           {codeAccumulator.trimEnd()}
                       </SyntaxHighlighter>
                    </div>
                );
                inCodeBlock = false;
                codeAccumulator = '';
                codeLang = '';
            } else {
                // Start of code block
                inCodeBlock = true;
                codeLang = line.substring(3).trim();
            }
        } else if (inCodeBlock) {
            codeAccumulator += line + '\n';
        } else {
            // Regular markdown parsing
            if (line.startsWith('# ')) {
                flushList();
                elements.push(<h1 key={index} className="text-xl font-orbitron text-primary font-bold mt-3 mb-1 pb-1 border-b border-primary-t-20">{renderInline(line.substring(2))}</h1>);
            } else if (line.startsWith('## ')) {
                flushList();
                elements.push(<h2 key={index} className="text-lg font-orbitron text-primary mt-2 mb-1">{renderInline(line.substring(3))}</h2>);
            } else if (line.startsWith('### ')) {
                flushList();
                elements.push(<h3 key={index} className="text-base font-orbitron text-text-secondary mt-2 mb-1">{renderInline(line.substring(4))}</h3>);
            } else if (line.startsWith('> ')) {
                flushList();
                elements.push(
                    <blockquote key={index} className="border-l-2 border-primary-t-50 pl-3 my-1 bg-black/10 italic text-text-muted">
                        {renderInline(line.substring(2))}
                    </blockquote>
                );
            } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                listItems.push(line.trim().substring(2));
            } else {
                flushList();
                if (line.trim() === '' && index === lines.length - 1 && elements.length > 0) return;
                elements.push(<div key={index}>{renderInline(line) || <>&nbsp;</>}</div>);
            }
        }
    });
    
    flushList(); // Flush any remaining list items at the end
    
    if (inCodeBlock) {
         elements.push(
            <div key={`code-${elements.length}`} className="relative my-2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-700">
               <CopyButton textToCopy={codeAccumulator} />
               <SyntaxHighlighter
                    language={codeLang || 'text'}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', backgroundColor: 'transparent' }}
                    codeTagProps={{ style: { fontFamily: 'monospace' }}}
               >
                   {codeAccumulator.trimEnd()}
               </SyntaxHighlighter>
            </div>
        );
    }

    return <>{elements}</>;
});

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start animate-fade-in-fast">
        <div className="p-2 px-4 rounded-2xl rounded-bl-md bg-panel">
            <div className="flex items-center gap-1 h-5">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0s]"></span>
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0.4s]"></span>
            </div>
        </div>
    </div>
);


const ChatLog: React.FC<ChatLogProps> = ({ history, appState }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, appState]);

  return (
    <div className="flex-1 overflow-y-auto p-4 styled-scrollbar">
      <div className="space-y-2">
        {history.map((message, index) => {
          const isModel = message.role === 'model';
          return (
            <div key={index} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-4xl p-2 px-3 rounded-2xl animate-fade-in-fast ${
                  isModel
                    ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-text-primary rounded-bl-md shadow-lg shadow-black/20 border border-slate-700'
                    : 'bg-gradient-to-br from-amber-500 to-yellow-600 text-black rounded-br-md shadow-lg shadow-yellow-500/20'
                }`}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="User content" 
                    className="rounded-lg mb-1 max-h-48"
                  />
                )}
                {message.chartData && <ChartRenderer data={message.chartData} />}
                <div className="whitespace-pre-wrap break-words min-h-[1.25rem]">
                  <FormattedMessage text={message.content} />
                   {isModel && appState === AppState.THINKING && index === history.length - 1 && message.content && (
                       <span className="inline-block w-2 h-4 bg-primary align-bottom ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>
                   )}
                </div>
                 {message.sources && message.sources.length > 0 && (
                  <SourceCitations sources={message.sources} />
                )}
                <div className={`text-right text-xs mt-1 flex justify-end items-center gap-1.5 ${
                    isModel ? 'text-text-muted' : 'text-yellow-900/80'
                }`}>
                    <span>{message.timestamp}</span>
                    {!isModel && (
                        <DoubleCheckIcon className="w-4 h-4" />
                    )}
                </div>
              </div>
            </div>
          );
        })}
        {appState === AppState.THINKING && (!history.length || history[history.length - 1].role === 'user' || (history[history.length - 1].role === 'model' && history[history.length-1].content)) && <TypingIndicator />}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatLog;