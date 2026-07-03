# Prompts

Append future prompts to this file.

## 2026-07-01 - Initial scaffold request

```text
I would like to initialize a new project using the ArcGIS Maps SDK for JavaScript. The app will be based on a 3D scene and use 3D data.

Run the official @arcgis/create CLI tool in the current workspace folder:

npx @arcgis/create

References:
- https://developers.arcgis.com/javascript/latest/get-started/#use-arcgiscreate
- https://www.npmjs.com/package/@arcgis/create

If VS Code asks for permission or if the CLI requires any input that cannot be determined directly from this prompt, pause and ask for input. Do not guess, auto-select, or simulate responses.

Technical constraints:

- Use the latest stable version of the SDK:
  https://developers.arcgis.com/javascript/latest/

- Use the CLI default template: minimal React + Vite with TypeScript.

- Prefer ArcGIS Map Components:
  https://developers.arcgis.com/javascript/latest/components/#map-components

- Use @arcgis/core only if Map Components are not sufficient, and explain why.

- Use Calcite components later only for interactive UI (e.g., buttons or tabs), not for layout: https://developers.arcgis.com/calcite-design-system/

- Prefer official docs, samples, and showcases:
  https://developers.arcgis.com/javascript/latest/
  https://developers.arcgis.com/javascript/latest/sample-code/
  https://developers.arcgis.com/javascript/latest/showcase/

- No authentication.
- No OAuth.
- No sign-in dialogs.
- Keep the first version minimal and easy to test locally.

For this step:

- The generated source code is the source of truth. Do not modify any generated files during this step.
- Do not add UI, logic, data, or placeholders.
- Use exactly the CLI output, unchanged.

After the CLI finishes:

- Create a Documentation folder if it does not already exist.

- Create short Markdown files covering:
  - Technical constraints
  - Other project decisions (including UX- or data-related decisions)
  - This prompt as the first entry in a prompts file

- Append future prompts to the same prompts file.
- Use these files as reference for future steps.

In the end, explain:

- Which command was run
- Which CLI options were selected
- What files and folders were created
- Which commands I should run next (e.g., install, start), if needed
- Anything unclear, missing, or not feasible

If any requirement cannot be met exactly, stop and explain before proceeding.
```

## 2026-07-01 - Output and project contents question

```text
What would be the output of the 3 commands that you displayed and explained as "next commands to run? Can you also describe me what does the current project contain?
```

## 2026-07-01 - Run install and dev, keep prompts log updated

```text
also remember to add my previous prompt and also this and all the future prompts to prompts.md file! Yes, run both commands so that I can see the exact CLI output on my machine and see how it looks. You can also audit the generated template against your constraints and list what should be removed or replaced in the next editing step (but do not make any of those changes yet).
```

## 2026-07-01 - Switch to 3D scene and remove OAuth

```text
Looking at the list, I would like you to do the following things: 
- Replace the current 2D sample map in App.tsx:1 with a 3D scene-based setup 
- Regarding calcite, I was wrong, you can use it for everything, including layout.
- Remove the unused OAuth helper in configureOAuth.ts:1 because the project must have no authentication, no OAuth, and no sign-in flow.
```

## 2026-07-01 - Remove scene info panel and cleanup leftovers

```text
The 3d seem looks mostly good. But do remove the UI element in the top left of the scene that says "Scene" and "This starter view uses the ArcGIS Scene component with world elevation and no authentication." Please do the next cleanup pass and remove any now-unused scaffold leftovers, such as the empty `src/auth/` directory. Also remove the top header which has the title and subtitle.
```

## 2026-07-01 - Scene data, UX concept, and mockups

```text
Okay, now let me share with you more information about data (web scene which you should use in this app), as well as my UX design. I will also share some UX mockups which I created. 

Public web scene https://zurich.maps.arcgis.com/home/webscene/viewer.html?webscene=a032056172494a81a2105ef9232ea9a9
 
**Concept**
I want to create an immersive, interactive exploration experience where the castle is the main focus. The 3D scene fills the screen, and UI elements remain minimal and unobtrusive. Interaction is simple and predictable, and user control always overrides automation. Motion is calm, slow, and intentional, creating the feeling of quietly exploring a place.
App starts on the “Overview” tab open. The Play button is not active by default.
**Navigation**
Top-level pill-style tabs represent key areas: Overview, High Castle, St. Mary’s Church, Dansker, Grand Master’s Palace, and Bridge Gate. Each tab corresponds to a slide in the web scene.
Clicking a tab moves the camera to that area (slide).
**Text**
Each area shows a short intro by default. “Read more” button below the text expands into a longer, scrollable text with a soft overlay for readability while keeping the scene visible.
“Read less” button below the expanded text collapses it back. When expanded, camera motion stops and auto-tour is disabled. The text should not cover the play button.
Text is stored in each slide's description. Use some basic understanding to understand how many initial sentences (or sentence) should be the
**Auto-Tour**
A play button at the bottom center starts a guided tour. The camera gently drifts around the current area and automatically moves to the next section after a few seconds. A circular progress arc shows timing. Clicking on the play button or anywhere in the screen pauses the tour. If a tab is clicked during the tour, the tour stops, the selected tab opens, and the play button switches to paused. The auto-mode stops at the last stop.
**Switching Layers**
A small thumbnail in the bottom-right corner allow switching between Gaussian splat and mesh layers. It also has a label. Clicking swaps the active layer.
```

## 2026-07-01 - Use local UX image paths

```text
Those are the UX images, can you use them from the paths I provide? "C:\Users\agn11392\OneDrive - Esri\Desktop\AI project screenshots\UX_3.png"
"C:\Users\agn11392\OneDrive - Esri\Desktop\AI project screenshots\UX_1.png"
"C:\Users\agn11392\OneDrive - Esri\Desktop\AI project screenshots\UX_2.png"
```

## 2026-07-01 - Proposed implementation plan request

```text
Given the instructions as well as the images, what is your proposed implementation plan? Can you save the plan as a md file in the documentation folder for reference? 
```

## 2026-07-01 - Plan review comments

```text
I have a few questions or comments to the proposed implementation plan: 
- "Build a normalized slide model with `id`, `title`, `description`, `viewpoint` or camera target, and precomputed text variants (`introText`, `fullText`)." -> I don't understand what that means, can you explain? 
- "run calm drift animation for the current stop" -> here I would like to have some camera animation that shows the structure from different sides, if it makes sense, for example go around it. I am not sure what is the best approach here. We can talk about it. 
- "Phase 5 - Polish and hardening." - I would like to skip this phase for now. 
- "while expanded text is open, stop camera drift, disable auto-tour transitions, and ensure panel layout does not cover the play button." - I don't want to have a panel with text. Instead, I want to have the background to get overlayed so that the text can be readible. Do you know what I mean? 
```

## 2026-07-01 - Start implementation phase 1

```text
Okay, let's start with the implementation phase 1!
```

## 2026-07-01 - Visual testing request

```text
I would like to test the app visually. Can you tell me what should I test? 
```

## 2026-07-01 - Stop local app for today

```text
Stop running the app locally. I am done for now, will continue tomorrow
```

## 2026-07-02 - Continue with phase 2

```text
We can continue with phase 2. When you are done, can you describe me what you did and app the run locally, so that I can test it? Also, tell me what I should test.
```

## 2026-07-02 - Phase 2 UX mismatch feedback

```text
Okay, the first version of steps implemented in phase 2 are quite far from the original concept seen at the UX photos. Did you consider the UX design pictures during the implementation? What works: 
- the tabs are implemented in the correct order, each tab changes the camera view 
- each tab is corrresponding to the right location and text
- text behavior when clicking read more and read less is correct 

What doesn't work:
- the tabs are visually separated. They should rather be a one element with multiple tabs, all wihtin one line (instead of two, as it is implemented at the moment)
- The text is wrong in quite a few aspects. First, it's located at the bottom left instead of centrally below the location tabs. Second, it's displayed on a panel, instead of just directly on the scene behind (with additional overlay to blur the background the make the text readable and provide enough contrast). Third, the "Malbork castle guide" title is unnecesary. Next, the scrollbar shouldn't be present at all times, just when text doesn't fit within given space. 
- The slides are not fully correct. For some locations, the slides in the web scene also include an active focus area. 
Please once again check the provided UX design images, the provided descriptions, my comments, as well as the technical constrainsts and propose me a new implementation for phase 2.
```

## 2026-07-02 - Text naming and revised implementation request

```text
Try again with the code implementation
```

## 2026-07-02 - Text overlay refinement request

```text
okay, that's already better, but still a few changes are necessary. Remove the title of the location from the text area: this is not necessary as the selected pill serves as a title. Then, the text is still displayed in an additional panel. That shouldn't be the case. The text should be displayd directly overlaying the scene instead of being rendered on an additional panel. When the text is displayed in full version, it should be printed on majority of the available space in the screen (just avoiding the play/pause bottom at the bottom, however the button was not implemented yet). Also, the entire scene should be overlayed, not just the text, when the text is expanded (see the reference UX designs once again).
```

## 2026-07-02 - Intro paragraph layout clarification request

```text
The current direction is closer, but the text layout is still not correct.

The introductory text should be visually centered directly below the navigation pill tabs and aligned with them as a single unit. Right now the text feels detached from the navigation and sits too far below it.

Also, the introductory text should remain exactly in place when the user clicks "Read more". The intro should be treated as its own paragraph and should not be reflowed into a larger text block.

When "Read more" is clicked:
- Keep the introductory paragraph unchanged.
- Keep its position, width, alignment, and line breaks unchanged.
- Append the additional content below it as separate paragraphs.

When "Read less" is clicked:
- Remove only the additional paragraphs.
- Leave the introductory paragraph exactly as it was.

Before changing any readability effects, focus only on:
1. Positioning the text directly below the navigation pills.
2. Keeping the intro fixed during expansion.
3. Splitting the expanded content into separate paragraphs.

Please explain how you would adjust the layout before making code changes. Remember to save this prompt to prompts.md file.
```

## 2026-07-02 - Implement intro paragraph layout changes

```text
Yes, go ahead and implement those changes.
```

## 2026-07-02 - Intro shift diagnosis request

```text
This is much closer.

The intro text is now centered correctly below the navigation pills. However, the intro text is still changing position when I click "Read more".

The problem is not the text content itself anymore. The entire text block appears to be re-centering when additional paragraphs are added.

The intro paragraph should stay in exactly the same position in both collapsed and expanded states.

Only the additional paragraphs should appear below the intro. Expansion should happen downward only and should not move the intro paragraph.

Please review the layout and identify why the intro paragraph is being repositioned when the expanded content is rendered.
```

## 2026-07-02 - Implement intro pinning fix

```text
okay, try to implement this

## 2026-07-02 - Push project to GitHub request

```text
I created a remote repository in github for this project (SSH: git@github.com:arozniak/malbork-castle-explorer.git). Can you help me to push all the work on this project into git?
```

## 2026-07-02 - Add local run instructions to README

```text
add those instructions to the README.md file
```
