// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
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
));
