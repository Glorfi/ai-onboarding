import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ICreateSiteRequest } from '@ai-onboarding/shared';
import { createSiteInputSchema } from '@ai-onboarding/shared';
import { Button, Input, Label } from '@/shared/ui';

interface CreateSiteFormProps {
  onSubmit: (data: ICreateSiteRequest) => void;
  isLoading?: boolean;
}

export function CreateSiteForm({ onSubmit, isLoading }: CreateSiteFormProps) {
  const [additionalUrlInput, setAdditionalUrlInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ICreateSiteRequest>({
    resolver: zodResolver(createSiteInputSchema),
    defaultValues: {
      url: '',
      name: '',
      additionalUrls: [],
    },
  });

  const additionalUrls = watch('additionalUrls') || [];

  const addAdditionalUrl = () => {
    if (additionalUrlInput && additionalUrls.length < 5) {
      try {
        new URL(additionalUrlInput);
        setValue('additionalUrls', [...additionalUrls, additionalUrlInput]);
        setAdditionalUrlInput('');
      } catch {
        // Invalid URL, don't add
      }
    }
  };

  const removeAdditionalUrl = (index: number) => {
    setValue(
      'additionalUrls',
      additionalUrls.filter((_, i) => i !== index)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Website URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          {...register('url')}
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Site Name (optional)</Label>
        <Input id="name" placeholder="My Website" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Additional URLs (max 5)</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/docs"
            value={additionalUrlInput}
            onChange={(e) => setAdditionalUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAdditionalUrl();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addAdditionalUrl}
            disabled={additionalUrls.length >= 5}
          >
            Add
          </Button>
        </div>
        {additionalUrls.map((url, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="truncate flex-1">{url}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeAdditionalUrl(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Site'}
      </Button>
    </form>
  );
}
