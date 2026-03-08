# Part 3 — Written Question (15 minutes)

Answer in **your own words**. 5-10 sentences is enough. No code needed.

---

## Question

> You're joining a project mid-way. The codebase is unfamiliar — it's a React + Node.js app with 50+ files, no documentation, and the previous developer has left. Your first real task is due in 2 days.
>
> **Walk me through exactly how you'd get productive in the first 2 hours.**
>
> Be specific. What do you open first? What do you look for? What tools do you use? How do you decide what to ignore?

---

## Answer

I’d start by getting the app running locally. I’d open the repository root, check for a README, and inspect the package.json to understand the project structure and available scripts. I’d run npm install and start the dev server so I can interact with the app in the browser and verify the backend is responding. Once running, I’d quickly scan the folder structure and open the main entry points, like App.tsx for React and server.js for the Node backend, to understand the startup flow.
I’d then use my editor’s global search to find files related to my assigned task, focusing only on those files and their immediate dependencies rather than reading the whole codebase. While testing the app, I’d also watch the browser’s Network tab to see which APIs are being called and how data flows between the frontend and backend. I’d ignore unrelated parts of the codebase and avoid refactoring until the task is complete. I also use AI-assisted tools, like Cursor, Claude or ChatGPT, when I’m in an unfamiliar codebase: to quickly understand a pattern I haven’t seen, to get a second opinion on where to look next, or to compare different ways of doing something. I don’t treat them as “copy-paste engines”; I still read the code myself, decide what’s relevant, and cross-check any suggestion against the actual project so I own the solution. That way I move faster without skipping the understanding. By the end of the first two hours, I’d aim to have the app running, understand the high-level structure, and know exactly where in the code my task needs to be implemented.
