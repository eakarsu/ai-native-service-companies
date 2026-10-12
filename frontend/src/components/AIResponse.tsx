import AIReport from './AIReport';

interface AIResponseProps { content: unknown; title: string; isLoading: boolean; onRegenerate?: () => void; }

export default function AIResponse({ content, title, isLoading, onRegenerate }: AIResponseProps) {
  return <div>
    <AIReport response={content} title={title} loading={isLoading} />
    {!isLoading && onRegenerate && content !== null && content !== undefined && content !== '' &&
      <button type="button" onClick={onRegenerate} className="mt-2 text-sm font-medium text-indigo-700 hover:underline">Regenerate report</button>}
  </div>;
}
