import { Button } from '@/shared/ui';
import { CreateSiteDialog } from '@/features/site/create';
import { SitesListWidget } from '@/widgets/sites-list';

export default function SitesPage() {
  return (
    <section className="container mx-auto px-6 pt-12">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Sites</h1>
          <p className="text-muted-foreground mt-1">
            Add sites, view crawl status, manage your site knowledge bases and configure your chat bots
          </p>
        </div>
        <CreateSiteDialog trigger={<Button size="lg">Add New Site</Button>} />
      </header>

      <SitesListWidget />
    </section>
  );
}
