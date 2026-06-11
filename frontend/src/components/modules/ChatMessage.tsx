import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  role: 'USER' | 'ASSISTANT';
  content: string;
  streaming?: boolean;
}

export function ChatMessage({ role, content, streaming }: ChatMessageProps) {
  const isUser = role === 'USER';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-elevated font-mono text-xs text-primary' : 'bg-neural-glow'
        }`}
      >
        {isUser ? (
          'D'
        ) : (
          <div className="h-3 w-3 rounded-full bg-neural-core shadow-[0_0_6px_var(--neural-core)]" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-elevated text-primary' : 'bg-surface text-secondary'
        }`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-p:text-secondary prose-strong:text-primary prose-li:text-secondary">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '');
                  const isBlock = match !== null;
                  if (isBlock) {
                    return <CodeBlock language={match[1]}>{String(children)}</CodeBlock>;
                  }
                  return (
                    <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs text-neural" {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {streaming && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-neural-core" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ children, language }: { children: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-subtle bg-elevated">
      <div className="flex items-center justify-between border-b border-subtle px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase text-muted">{language}</span>
        <button onClick={copy} className="text-muted transition-colors hover:text-neural">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs text-secondary">
        <code>{children}</code>
      </pre>
    </div>
  );
}
