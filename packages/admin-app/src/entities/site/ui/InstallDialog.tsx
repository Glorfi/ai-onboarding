import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  KbdGroup,
  Kbd,
} from '@/shared/ui';
import type { ISiteWithApiKeyDTO } from '@ai-onboarding/shared';
import { Code, Info } from 'lucide-react';
import { ScriptBlock } from './ScriptBlock';
import { formatDomain } from '../lib';

interface IInstallDialog {
  site: ISiteWithApiKeyDTO;
}

const ProductionTabContent = (props: IInstallDialog) => {
  const { site } = props;

  const script = `<script
  src="${import.meta.env.VITE_WIDGET_URL}"
  data-api-key="${site.apiKey?.key}"
  data-api-url="${import.meta.env.VITE_API_URL}"
  defer
></script>`;

  return (
    <TabsContent
      value="production"
      className="mt-6 max-h-[60vh] overflow-y-auto pr-4"
    >
      <div className="space-y-6">
        {/* Intro */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Production installation</h3>
          <p className="text-sm text-muted-foreground">
            Embed the widget into your website so it loads automatically for
            your users. The widget script should be added once and will persist
            across page navigations.
          </p>
        </div>

        <Tabs defaultValue="html">
          <TabsList variant="line">
            <TabsTrigger value="html">HTML (Recommended)</TabsTrigger>
            <TabsTrigger value="spa">SPA Frameworks</TabsTrigger>
            <TabsTrigger value="ssr">SSR (Next.js, Nuxt, Remix)</TabsTrigger>
          </TabsList>

          {/* HTML */}
          <TabsContent value="html" className="space-y-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-4">
                <Badge variant="secondary">Step 1</Badge>
                <div className="space-y-1">
                  <p className="font-medium">
                    Add the script to your HTML document
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Insert the following code right before the closing{' '}
                    <code>&lt;/body&gt;</code> tag.
                  </p>
                  <ScriptBlock code={script} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Once added, the widget will load automatically on every page
                where this HTML template is used.
              </p>
            </Card>

            <Alert>
              <Info className="text-muted-foreground" />
              <div className="pl-1 space-y-1">
                <p className="font-medium">Important</p>
                <p className="text-sm text-muted-foreground">
                  Make sure the script is included only once on the page. Adding
                  it multiple times will result in multiple widgets.
                </p>
              </div>
            </Alert>
          </TabsContent>

          {/* SPA */}
          <TabsContent value="spa" className="space-y-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-4">
                <Badge variant="secondary">How it works</Badge>
                <div className="space-y-1">
                  <p className="font-medium">Single Page Applications</p>
                  <p className="text-sm text-muted-foreground">
                    For React, Vue, Angular and other SPA frameworks, the widget
                    script should be loaded once and will persist between route
                    changes.
                  </p>
                  <ScriptBlock code={script} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                When placed in the main HTML file (for example{' '}
                <code>index.html</code>), the widget will not be reloaded during
                client-side navigation, preserving the chat session.
              </p>
            </Card>

            <Alert>
              <Info className="text-muted-foreground" />
              <div className="pl-1 space-y-1">
                <p className="font-medium">Do not inject dynamically</p>
                <p className="text-sm text-muted-foreground">
                  Avoid injecting the script inside page-level components or
                  route hooks. This may cause the widget to reinitialize on
                  navigation.
                </p>
              </div>
            </Alert>
          </TabsContent>

          {/* SSR */}
          <TabsContent value="ssr" className="space-y-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-4">
                <Badge variant="secondary">SSR setup</Badge>
                <div className="space-y-1 ">
                  <p className="font-medium">Server-rendered applications</p>
                  <p className="text-sm text-muted-foreground">
                    For SSR frameworks such as Next.js, Nuxt or Remix, add the
                    script to your root HTML layout or document template.
                  </p>
                  <ScriptBlock code={script} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Place the script in a shared layout or document file that is
                rendered on every page. This ensures the widget loads only once
                and remains active during client-side navigation, keeping the
                chat history intact.
              </p>
            </Card>

            <Alert>
              <Info className="text-muted-foreground" />
              <div className="pl-1 space-y-1">
                <p className="font-medium">Avoid page-level insertion</p>
                <p className="text-sm text-muted-foreground">
                  Do not add the script inside individual pages or components.
                  This can cause the widget to reload and reset its state.
                </p>
              </div>
            </Alert>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* CSP */}
        <Alert>
          <Info className="text-muted-foreground" />
          <div className="pl-1 space-y-2">
            <p className="font-medium">Content Security Policy</p>
            <p className="text-sm text-muted-foreground">
              If your website uses a strict Content Security Policy (CSP), make
              sure that loading scripts from the widget domain is allowed.
              Otherwise, the widget may fail to load.
            </p>
          </div>
        </Alert>
      </div>
    </TabsContent>
  );
};

const TestTabContent = (props: IInstallDialog) => {
  const { site } = props;
  const script = `const s = document.createElement('script');
s.type = 'text/javascript';
s.src = '${import.meta.env.VITE_WIDGET_URL}';
s.dataset.apiKey = "${site.apiKey?.key}";
s.dataset.apiUrl = "${import.meta.env.VITE_API_URL}";
document.body.appendChild(s);`;
  return (
    <TabsContent
      value="test"
      className="mt-6 max-h-[60vh] overflow-y-auto pr-4"
    >
      <div className="space-y-6">
        {/* Intro */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Test embedding via browser console
          </h3>
          <p className="text-sm text-muted-foreground">
            This method is suitable for quickly testing the widget without
            modifying your website’s code. You can manually inject the widget
            directly from the browser console.
          </p>
        </div>

        {/* Step 1 */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Badge variant="secondary">Step 1</Badge>
            <div className="space-y-1">
              <p className="font-medium">
                Open your website -{' '}
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {site.url}
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Navigate to the page where you plan to embed the widget.
                Important: this should be the same page where the widget will be
                used in production.
              </p>
            </div>
          </div>
        </Card>

        {/* Step 2 */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Badge variant="secondary">Step 2</Badge>
            <div className="space-y-1">
              <p className="font-medium">Open the browser console</p>
              <p className="text-sm text-muted-foreground">
                Press{' '}
                <KbdGroup>
                  <Kbd className="px-1 py-0.5 border rounded">F12</Kbd> or
                  <Kbd className="px-1 py-0.5 border rounded">Ctrl / Cmd</Kbd>+
                  <Kbd>Shift</Kbd>+<Kbd>I</Kbd>
                </KbdGroup>
                , then switch to the <strong>Console</strong> tab.
              </p>
            </div>
          </div>
        </Card>

        {/* Step 3 */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Badge variant="secondary">Step 3</Badge>
            <div className="space-y-3 w-full">
              <p className="font-medium">
                Paste the widget initialization code
              </p>

              <ScriptBlock code={script} />

              <p className="text-sm text-muted-foreground">
                Press <strong>Enter</strong>. The script will be loaded and the
                widget will appear on the page.
              </p>
            </div>
          </div>
        </Card>

        {/* Result */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Badge>Done</Badge>
            <div className="space-y-1">
              <p className="font-medium">Widget is active</p>
              <p className="text-sm text-muted-foreground">
                After executing the code, the chat widget will appear on the
                page and you can fully test its behavior.
              </p>
            </div>
          </div>
        </Card>

        <Separator />

        {/* Limitations */}
        <Alert className="w-full">
          <Info className="text-muted-foreground" />
          <div className="space-y-2 w-full pl-1">
            <p className="font-medium">Important notes</p>
            <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1 w-full">
              <li>
                The widget is embedded{' '}
                <strong>only in the current browser tab and window</strong>.
                After a page reload, you will need to inject it again.
              </li>
              <li>
                Some websites may block script loading due to{' '}
                <strong>Content Security Policy (CSP)</strong>.
              </li>
              <li>
                Console-based embedding is intended for testing only and does
                not reflect final production behavior.
              </li>
              <li>
                For real usage, we recommend embedding the script directly into
                your website’s HTML.
              </li>
            </ul>
          </div>
        </Alert>
      </div>
    </TabsContent>
  );
};

export const InstallDialog = (props: IInstallDialog) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Install</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] min-md:min-w-3xl flex flex-col">
        {/* Header — fixed */}
        <DialogHeader>
          <DialogTitle>Installation</DialogTitle>
          <DialogDescription>
            Let’s get your widget up and running.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1">
          <Tabs defaultValue="production">
            <TabsList variant="line">
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="test">Test mode</TabsTrigger>
            </TabsList>
            <ProductionTabContent site={props.site} />
            <TestTabContent site={props.site} />
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
