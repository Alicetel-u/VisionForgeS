---
description: Update the video script in cat_data.json while strictly adhering to AI rules.
---
# Workflow for Updating Video Script

This workflow MUST be followed whenever updating the video script (`cat_data.json`).

1. **MANDATORY: Load and Read Rules**
   - Use `view_file` to read `AI_RULES.md` in the project root.
   - **CONFIRM**: Do you understand the rule about maintaining original text verbatim?
   - If `AI_RULES.md` does not exist, look for it in `c:\Users\【RST-9】リバイブ新所沢\Desktop\Antigravity_Projects\VisionForgeS\AI_RULES.md`.

2. **Wait for User Input (if script not provided)**
   - If the new script text is not already provided in the request, ask the user for it.

3. **Read Existing Data**
   - Read the current `video/public/cat_data.json` to understand the structure.

4. **Draft the Update (Mental Check)**
   - Map the user's provided text to the JSON structure.
   - **CRITICAL CHECK**: Compare your draft against the user's input text.
     - Did you change any endings (e.g., "だ" to "です")? -> **STOP. REVERT.**
     - Did you add any dialect (e.g., "なのだ")? -> **STOP. REVERT.**
     - The text must be an **EXACT COPY**. 
     - Only *formatting* (splitting into lines/clips) is allowed to fit the 3-line limit.

5. **Update `cat_data.json`**
   - Use `write_to_file` to update `video/public/cat_data.json` with the verified content.
   - Ensure character assignment (Speaker) is correct, but **TEXT MUST BE ORIGINAL**.
   - Clear `audio` fields to "" to trigger regeneration.

6. **Final Verification**
   - Read the updated file again.
   - Verify one last time against the user's input.
   - Report completion.
