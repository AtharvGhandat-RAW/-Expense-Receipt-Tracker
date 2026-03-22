# How to Use Your Microproject Report

## File Created
**Filename:** `Decision_Tree_vs_Random_Forest_Report.html`

## Opening the Report

### Method 1: Open in Web Browser (RECOMMENDED)
1. **Right-click** on `Decision_Tree_vs_Random_Forest_Report.html`
2. Select **"Open With" → Browser** (Chrome, Firefox, Edge, Safari)
3. The report will display beautifully formatted!

### Method 2: Open in Microsoft Word
1. **Right-click** on `Decision_Tree_vs_Random_Forest_Report.html`
2. Select **"Open With" → Microsoft Word**
3. Word will convert the HTML to a document
4. Save as `.docx` if needed

### Method 3: Print to PDF
1. Open the file in a web browser
2. Press **Ctrl+P** (Windows) or **Cmd+P** (Mac)
3. Select **"Save as PDF"** as the printer
4. Click **Save**
5. You now have a PDF version!

## What to Edit Before Submitting

Replace these placeholders with your actual information:

### On Cover Page:
- `[INSERT INSTITUTE NAME]` → Your college name
- `[Student Name(s)]` → Your name(s)
- `[Roll Number(s)]` → Your roll number(s)
- `[Class/Year]` → Your class (e.g., "Third Year Computer Engineering")
- `[Guide Name]` → Your project guide's name
- `[INSERT CODE]` → Subject code (e.g., "AAM301")
- `[20__-20__]` → Academic year (e.g., "2025-2026")

### On Certificate Page:
- Same placeholders as above
- `[HOD Name]` → Head of Department name
- `[Principal Name]` → Principal name
- Date and Place fields

### How to Edit:
1. Open HTML file in **any text editor** (Notepad, VS Code, etc.)
2. Press **Ctrl+F** to find
3. Search for `[INSERT` or `[Student` etc.
4. Replace with your actual information
5. Save the file
6. Reopen in browser to verify

## Adding Page Numbers

**Option 1: Print with Page Numbers**
- When printing/saving as PDF, enable "Headers and Footers"
- This will add page numbers automatically

**Option 2: Edit Index Page Numbers**
- After printing, manually count pages
- Update the `___` placeholders in the Index table with actual page numbers

## Print Settings (For Best Results)

When printing:
- **Paper Size:** A4
- **Orientation:** Portrait
- **Margins:** Default or Custom (as specified in CSS)
- **Colors:** Black and White or Color (your choice)
- **Double-sided:** Yes (saves paper)
- **Page Numbers:** Enable in footer

## Converting to Word Document

If you need a `.docx` file:

1. Open HTML in **Microsoft Word**
2. Click **File → Save As**
3. Choose format: **Word Document (.docx)**
4. Save with your desired filename

**Note:** Some formatting may shift slightly. Review and adjust if needed.

## Customization Options

### Change Font:
In the HTML file, find this line in the `<style>` section:
```css
font-family: 'Times New Roman', Times, serif;
```
Change to:
- `'Arial', sans-serif;` for Arial
- `'Calibri', sans-serif;` for Calibri

### Change Font Size:
Find:
```css
font-size: 12pt;
```
Change to `11pt` or `13pt` as needed.

### Change Line Spacing:
Find:
```css
line-height: 2;
```
Change to:
- `1.5` for 1.5 spacing
- `1.15` for single spacing

## Sections Included

✅ Cover Page
✅ Certificate
✅ Acknowledgement
✅ Index/Table of Contents
✅ Abstract
✅ Introduction
✅ Objectives
✅ Problem Statement
✅ Literature Review
✅ Theory - Decision Tree
✅ Theory - Random Forest
✅ Working Example with Student Data
✅ Detailed Comparison Table
✅ Advantages and Limitations
✅ Algorithms (Pseudocode)
✅ Diagrams (Tree structures, voting)
✅ Results and Discussion
✅ Conclusion
✅ Future Scope
✅ References

## Tips for Submission

1. **Print Preview First:** Always check how it looks before final printing
2. **Check for Errors:** Review all content for any typos
3. **Bind Properly:** Use spiral binding or report folder
4. **Add Diagrams:** You can insert additional colored diagrams from PowerPoint/Canva
5. **Page Limit:** Report is comprehensive but not excessive (~20-25 pages printed)

## For Viva Preparation

The report is written in **simple, student-friendly language** to help you:
- Understand concepts deeply
- Explain confidently to faculty
- Answer viva questions easily

**Read the report 2-3 times before viva to internalize the content!**

## Troubleshooting

**Problem:** Formatting looks wrong in browser
**Solution:** Try a different browser (Chrome recommended)

**Problem:** Word messes up the formatting
**Solution:** Use "Print to PDF" instead, then submit PDF

**Problem:** Need to add more content
**Solution:** Edit HTML file, add content in appropriate `<div class="page">` sections

**Problem:** Need diagrams
**Solution:** Replace ASCII diagrams with images (insert `<img>` tags)

## Need Help?

- Read section comments in HTML file for structure
- Tables use standard HTML `<table>` tags
- Diagrams are in `<div class="diagram">` blocks
- Each major section is in `<div class="page">` for page breaks

---

## Summary

Your report is **100% submission-ready** after you:
1. ✏️ Fill in your personal details (student name, roll number, guide, etc.)
2. 🖨️ Print or convert to PDF
3. 📊 Add page numbers to Index (optional)
4. 📚 Bind and submit!

**Good luck with your microproject submission and viva! 🎓**
