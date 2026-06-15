# AskBlue OpenAI setup

This repo can stay on GitHub Pages for the frontend, but OpenAI calls must go through a backend so the API key is not exposed in `index.html`.

## Backend option: Vercel

1. Import this GitHub repo into Vercel.
2. Add an environment variable:

   ```text
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Optional environment variables:

   ```text
   OPENAI_MODEL=gpt-5.5
   ASKBLUE_ALLOWED_ORIGIN=https://your-github-pages-url
   ```

4. Deploy the Vercel project.
5. Copy the deployed API URL, for example:

   ```text
   https://your-vercel-app.vercel.app/api/chat
   ```

6. In `index.html`, set:

   ```js
   const ASKBLUE_AI_ENDPOINT = window.ASKBLUE_AI_ENDPOINT || "https://your-vercel-app.vercel.app/api/chat";
   ```

7. Commit and push the updated `index.html`.

## Local fallback

If `ASKBLUE_AI_ENDPOINT` is blank, the page still works with its local manager dashboard, skill recommendations, training plans, task lifecycles, Intern10 planning, email drafts, capstone ideas, and hour-scaled assignment workflows. Free-form AI responses require the backend endpoint.
