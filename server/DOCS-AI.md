# Docs assistant

The Docs composer calls `POST /api/docs/assistant`. It supports document drafting,
rewriting, translation, summaries, comparisons, and questions, with follow-up
conversation and optional text/Markdown attachments. Responses include editable
document proposals and references to supplied documents. Nothing is saved until
the user saves in the document editor. Task document rewrites become separate
browser drafts; existing browser drafts can be updated.

## Enable locally

Copy `.env.example` to `.env`, set `OPENAI_API_KEY`, and restart `npm run dev`.
`OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. Credentials are loaded
only by the server and must never use a `VITE_` prefix. For hosted deployments,
configure these environment variables on the server and redeploy.

The assistant receives task document content from server storage and unarchived
browser drafts from the current client. Where generated content is missing, it
receives task descriptions explicitly marked as not being full documents.
Context is limited to 100 documents, 10,000 characters per document, recent
conversation, and one attachment of up to 30,000 characters. The model is told
when content is truncated or documents are omitted. It cannot access external
files, publish, change sharing, or delete documents.

Implementation follows the OpenAI Responses API's structured output format:
https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

Run `node --test tests/docs-ai.test.js` and `npm run build` to check the integration.
The API tests mock the AI service; a configured key is required for live testing.
