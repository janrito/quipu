import "~/assets/main.pcss";
import "@fontsource/iosevka/100.css";
import "@fontsource/iosevka/200.css";
import "@fontsource/iosevka/400.css";

import { mount } from "svelte";

import App from "~/components/App.svelte";

const app = mount(App, { target: document.body });

export default app;
