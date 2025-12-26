I have added a download button to the gallery so you can easily download your generated images.

### Changes Made
1.  **Modified `src/app/dashboard/gallery/client.tsx`**:
    *   Imported `Download` and `ExternalLink` icons from `lucide-react`.
    *   Implemented `handleDownload` function to handle secure image downloads using `fetch` and `blob` creation to force a download instead of just opening the image.
    *   Added a fallback to `window.open` if the programmatic download fails.
    *   Updated the image overlay UI to include a "Download" button next to the existing "Open" button, with consistent styling.

### How to Verify
1.  Navigate to the Gallery page in the dashboard.
2.  Hover over any generated image.
3.  You should see a "Download" button next to the "Open" button.
4.  Clicking "Download" should start downloading the image to your computer.
