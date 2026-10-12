# Configurator fixes: manual test tutorial

## Open the fixed version

From the project folder, run:

```sh
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/?size=946ml&color=forest-green` on the computer. If Vite prints a different port, use that port. For an iPhone on the same Wi-Fi, open the **Network** URL printed by Vite, adding `?size=946ml&color=forest-green`. The server must remain running. Safari on the phone must use the computer's Network URL, because `localhost` on the phone points to the phone itself.

The local app tests the editor and review images. Cart, charging, and customer emails require the WordPress integration. The live website will show these fixes only after the new frontend build is deployed.

## 1. Reproduce the upward-drag report

1. Select **946ml**, **Forest Green**, and **Achter** (back).
2. Choose **Premium designs → Sport → Baseball**.
3. Select the baseball and set **Grootte** (size) to approximately **94%**, with **Hoek** (angle) at **0°**.
4. Drag the artwork upward, toward and beyond the dotted engraving boundary.
5. Repeat toward the bottom, left, and right edges.

**Pass:** The blue selection box can reach the dotted boundary and stops there. The design stays inside the engraving area. It should not stop with the earlier large empty gap. A very small gap between the visible strokes and the box is normal artwork padding; circular or transparent artwork does not fill every corner of its selection rectangle.

## 2. Compare editor and review

1. Take a screenshot of the baseball at the top boundary.
2. Select **Bekijken** (review).
3. Inspect the back preview. Scroll down on mobile if necessary.
4. Select **Bewerk achterzijde** (edit back) and compare it with your first screenshot.
5. Repeat after moving the baseball near the bottom, and once after setting **Hoek** to **45°**.

**Pass:** The baseball has the same proportions, rotation, and placement relative to the bottle in both views. The review bottle is displayed at a different overall size; that is expected. The artwork must not become taller, flatten, move, or change its metallic highlight.

## 3. Check multiple layers

1. Return to the editor and use **+ Nog een toevoegen** (add another).
2. Choose **Initialen/Monogram**, select **ITC Modern** (the first single-letter `J` style), and enter **D**. The default Block Script style needs at least two initials, so use a single-letter style for this test.
3. Use **+ Nog een toevoegen** again, choose **Eigen tekst/Tekst**, and enter **HYDRATE**.
4. Place the letter, baseball, and text so all three can be recognized. First separate them, then overlap the letter and baseball.
5. Review the result, return to editing, move only the text, and review again.

**Pass:** All three layers remain visible in the intended order. Only the selected layer changes. Returning to editing preserves the composition, and the next review uses the latest positions.

## 4. Check resizing, rotation, and colors

1. Use both the size slider and the lower-right resize handle.
2. Rotate using the top-left handle, then enter **0°**, **45°**, and **90°** in the angle field.
3. Move the rotated design against each engraving boundary.
4. Change the color to **Pure White** and then back to **Forest Green**. On mobile, use **Kies kleur**.
5. Select each layer and open review after each color change.

**Pass:** Resizing preserves proportions. Rotated artwork remains within the engraving area. The selection outline and handles stay aligned with the artwork. The lighter bottle uses darker engraving shading in both editor and review. Every layer remains present.

## 5. Repeat across sizes and sides

Changing bottle size currently clears the design, so recreate the test artwork after each size change.

| Size | Suggested colors | Sides to check |
| --- | --- | --- |
| 946ml | Forest Green, Pure White, Midnight Black | Voor and Achter |
| 710ml | Forest Green, Midnight Black | Voor and Achter |
| 536ml | Light Pink, Pure White | Voor and Achter |

Run tests 1–3 for each combination. The front engraving area is shorter than the back area, so large artwork may be reduced to fit. It should retain that fitted shape in review.

Also leave one side blank and review: the blank side should show only the original bottle image, with no leftover custom artwork.

## 6. Repeat on iPhone Safari

Use the same test cases in portrait orientation. Drag with one finger, resize and rotate with the handles, and open/close review several times. Repeat one case in landscape orientation.

**Pass:** Touch gestures move the selected artwork. The controls remain usable and the review matches the editor. A desktop mobile viewport check does not replace this Safari test.

## Optional: inspect uploaded artwork

Add a simple square or circular PNG/SVG through **Eigen logo/Upload**, complete its upload confirmation, and combine it with a text layer. Resize, rotate, and review it. Its proportions and relative placement should match the editor.

## Optional: run the browser regression page

With the development server running, open `http://localhost:5173/preview-regression.html`. It should finish with **30 passed, 0 failed**. This page checks real SVG/PNG output across the calibrated bottle colors, both sides, mixed layers, metallic highlights, and blank sides. It is a development test page and is not included in the production build.

The geometry unit tests can be run with:

```sh
node --test tests/designItems.test.js
```

## WordPress handoff after the configurator checks

Run `npm run build` and provide the resulting `dist/` contents to the person updating WordPress. Those contents replace the embedded frontend in the installed plugin's `configurator/` directory. This change does not require replacing the PHP pricing code.

Use a staging/test order to compare editor → review → cart preview → order email. Compare the shape, position, rotation, and presence of all layers. Previously generated order images will not be regenerated by this frontend update. Pricing and email amount labels remain a separate WordPress task.

## If a test fails

Record the bottle size, color, side, browser/device, artwork types, size percentage, and angle. Capture the editor and review from the same session and describe the action immediately before the mismatch.
