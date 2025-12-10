import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "SWR OpenAPI",
  description: "Bindings for SWR and OpenAPI schemas",
  cleanUrls: true,
  themeConfig: {
    outline: "deep",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/', },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API Reference', link: '/api/hook-builders' }
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          {text: "Introduction", link: "/getting-started"},
          {text: "Setup", link: "/getting-started#setup"},
          {text: "Basic Usage", link: "/getting-started#basic-usage"}
        ],
      },
      {
        text: "API Reference",
        base: '/api',
        items: [
          {
            text: 'Hook Builders',
            link: '/hook-builders'
          },
          {
            text: 'useImmutable',
            link: '/use-immutable'
          },
          {
            text: 'useInfinite',
            link: '/use-infinite'
          },
          {
            text: 'useMutate',
            link: '/use-mutate'
          },
          {
            text: 'useQuery',
            link: '/use-query'
          },

        ]
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/htunnicliff/swr-openapi' }
    ],
    footer: {
      message: 'Released under the <a href="https://github.com/htunnicliff/swr-openapi/blob/main/LICENSE">MIT License</a>'
    },
    search: {
      provider: "local",
    }
  }
})
