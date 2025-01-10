# AI Agent For WordPress Customer assistance &middot; [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/open-kbs/ai-agent-for-woocommerce/blob/main/LICENSE)
<table>
  <tr>
    <td>
      <img src="app/icon.png" alt="App Icon" style="width: 100px; margin-right: 10px;">
    </td>
    <td>
      <strong>AI agent designed to provide WordPress customer assistance</strong>
    </td>
  </tr>
</table>

## Configuration

After installing the Agent through the OpenKBS WordPress plugin, follow these steps to configure the key features:

### Search Widget Setup

Navigate to **OpenKBS → Settings → Applications → WP Customer**
- Enable "Semantic Search Indexing"
- Click "Start Indexing" to generate embeddings for your existing WordPress content (posts, pages, products)

Go to **OpenKBS → Settings → Public Search API**
- Enable "Public Search API"
- Copy the provided Shortcode

Navigate to **Appearance → Widgets**
- Add a "Shortcode" widget to your header widget area

**Note**: If you have "WP Agent" installed, you can ask it to integrate the Shortcode into your wordpress or replace the woocommerce default search

### Chat Widget Setup

The chat widget integrates automatically with the site search, enabling the LLM AI Model to search your website data and assist clients with real-world actions.

To enable the Chat Widget:
1. Go to **OpenKBS → Settings → Applications → WP Customer**
2. Enable the "Website Chat Widget"

