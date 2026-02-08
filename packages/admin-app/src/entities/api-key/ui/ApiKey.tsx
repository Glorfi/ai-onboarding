import { useReduxToast } from '@/shared/lib';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui';
import type { IApiKeyDTO } from '@ai-onboarding/shared';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface IApiKeyBlockProps {
  apiKey: IApiKeyDTO;
}

export default function ApiKeyBlock(props: IApiKeyBlockProps) {
  const { apiKey } = props;
  const [copied, setCopied] = useState(false);
  const { toast } = useReduxToast();

  const widgetUrl = `https://unpervasive-densus-yan.ngrok-free.dev/widget.js`;
  const apiUrl = `http://${window.location.hostname}:3000`;

  const scriptCode = `<script type="text/javascript" src="${widgetUrl}" data-api-key="${apiKey.key}" data-api-url="${apiUrl}"></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        variant: 'success',
        title: 'Your script has been copied!',
        description: 'Paste it before the closing body tag on your website',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    // <div className="space-y-3 mt-2">
    //   <div>
    //     <h3 className="text-sm font-medium">You website</h3>
    //     <p className="text-sm text-muted-foreground">
    //       Copy your widget script and install it on your website
    //       Copy this script and paste it before the closing{' '}
    //       <code>&lt;/body&gt;</code> tag on your website. The widget will load
    //       automatically and connect using your API key.
    //     </p>
    //   </div>

    //   <div className="relative">
    //     <pre className="overflow-x-auto rounded-lg bg-muted p-4 pr-12 font-mono text-xs">
    //       <code className="break-all whitespace-pre-wrap text-foreground">{scriptCode}</code>
    //     </pre>

    //     <Button
    //       variant="ghost"
    //       size="icon"
    //       className="absolute right-2 top-2"
    //       onClick={handleCopy}
    //       aria-label={copied ? 'Copied' : 'Copy script'}
    //     >
    //       {copied ? (
    //         <Check className="h-4 w-4" />
    //       ) : (
    //         <Copy className="h-4 w-4" />
    //       )}
    //     </Button>
    //   </div>

    //   <p className="text-xs text-muted-foreground">
    //     Keep your API key secure. If you regenerate it, don’t forget to update
    //     the script on your site.
    //   </p>
    // </div>
  );
}
