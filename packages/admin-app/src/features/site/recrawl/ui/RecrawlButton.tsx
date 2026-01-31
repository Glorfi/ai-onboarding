import { Button } from '@/shared/ui';
import { useReduxToast } from '@/shared/lib';
import { useRecrawlSiteMutation } from '../api';

interface RecrawlButtonProps {
  siteId: string;
  disabled?: boolean;
}

export function RecrawlButton({ siteId, disabled }: RecrawlButtonProps) {
  const [recrawl, { isLoading }] = useRecrawlSiteMutation();
  const { toast } = useReduxToast();

  const handleRecrawl = async () => {
    try {
      await recrawl(siteId).unwrap();
      toast({
        title: 'Recrawl Started',
        description:
          'The site will be re-crawled. This may take a few minutes.',
        variant: 'success',
      });
    } catch {
      // Error handled by errorMiddleware
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRecrawl}
      disabled={disabled || isLoading}
    >
      {isLoading ? 'Starting...' : 'Recrawl'}
    </Button>
  );
}
