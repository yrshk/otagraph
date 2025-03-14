import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://astro.build/config
export default defineConfig({
    integrations: [
        react(),
        tailwind({
            applyBaseStyles: false
        })
    ],
    output: 'hybrid',
    adapter: netlify(),
	
	vite: {
		plugins: [
			nodePolyfills(
			{overrides:{fs:'memfs'}}
			),
		],
	},
	
	devToolbar:{enabled:false}
});