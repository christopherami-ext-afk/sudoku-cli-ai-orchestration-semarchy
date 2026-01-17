---
name: scaffold-from-story
description: "Scaffold the repo based on the scaffold story."
agent: agent
---
Read `.github/copilot-instructions.md` and the selected story text.
Scaffold ONLY what is needed for that story.
After scaffolding, output:
- What files you created/modified (paths only)
None
- The commands to run to verify (install, test, typecheck)
- Any TODOs that belong to later stories (do not implement them now)
Story (selected text):
${selectedText}