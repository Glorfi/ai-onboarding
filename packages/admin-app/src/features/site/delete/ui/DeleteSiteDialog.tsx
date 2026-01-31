import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  Button,
  Alert,
  AlertDescription,
} from '@/shared/ui';
import { useReduxToast } from '@/shared/lib';
import { useDeleteSiteMutation } from '../api';

interface DeleteSiteDialogProps {
  siteId: string;
  siteName: string;
  trigger: React.ReactNode;
}

export function DeleteSiteDialog({
  siteId,
  siteName,
  trigger,
}: DeleteSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteSite, { isLoading }] = useDeleteSiteMutation();
  const { toast } = useReduxToast();

  const handleDelete = async () => {
    try {
      await deleteSite(siteId).unwrap();
      toast({
        title: 'Deleted',
        description: 'Site has been deleted successfully.',
        variant: 'success',
      });
      setOpen(false);
    } catch {
      // Error handled by errorMiddleware
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Site</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{siteName}"?
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            This action cannot be undone. All crawled data and knowledge base
            entries for this site will be permanently deleted.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Site'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
