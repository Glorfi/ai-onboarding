import { useState } from 'react';
import type { ICreateSiteInput } from '@ai-onboarding/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@/shared/ui';
import { useReduxToast } from '@/shared/lib';
import { useCreateSiteMutation } from '../api';
import { CreateSiteForm } from './CreateSiteForm';

interface CreateSiteDialogProps {
  trigger?: React.ReactNode;
}

export function CreateSiteDialog({ trigger }: CreateSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [createSite, { isLoading }] = useCreateSiteMutation();
  const { toast } = useReduxToast();

  const handleSubmit = async (data: ICreateSiteInput) => {
    try {
      await createSite(data).unwrap();
      toast({
        title: 'Success',
        description: 'Site created successfully. Crawling will start shortly.',
        variant: 'success',
      });
      setOpen(false);
    } catch {
      // Error handled by errorMiddleware
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Site</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to crawl and index.
          </DialogDescription>
        </DialogHeader>
        <CreateSiteForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
