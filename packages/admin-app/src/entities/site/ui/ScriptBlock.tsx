import { Button } from '@/shared/ui';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface IScriptBlock {
  code: string;
}

export const ScriptBlock = (props: IScriptBlock) => {
  const { code } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative max-w-full">
      {/* Code */}
      <pre
        className="
          rounded-md bg-muted p-3 text-sm
          overflow-hidden whitespace-pre-wrap break-all
          pr-12
          mask-gradient
        "
      >
        {code}
      </pre>

      {/* Copy button */}
      <Button
        onClick={handleCopy}
        size={'icon'}
        variant={"secondary"}
        className="
          absolute top-2 right-2

        "
        aria-label="Copy script"
      >
        {copied ? <Check className="h-4 w-4 " /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};
