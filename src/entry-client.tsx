// @refresh reload
import { StartClient, mount } from "@solidjs/start/client";
import type { JSX } from "solid-js";

mount((): JSX.Element => <StartClient />, document.getElementById("app")!);
