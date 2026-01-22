// @refresh reload
import type { DocumentComponentProps } from "@solidjs/start/server";
import { createHandler, StartServer } from "@solidjs/start/server";
import type { JSX } from "solid-js";

export default createHandler(
  (): JSX.Element => (
    <StartServer
      document={({ assets, children, scripts }: DocumentComponentProps): JSX.Element => (
        <html lang="en" class="h-dvh w-dvw">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Chess</title>
            {assets}
          </head>
          <body class="h-dvh w-dvw overflow-auto bg-radial from-neutral-700 from-0% to-neutral-900 to-75% text-neutral-50 antialiased">
            <div id="app" class="size-full overflow-auto">
              {children}
            </div>
            {scripts}
          </body>
        </html>
      )}
    />
  ),
);
