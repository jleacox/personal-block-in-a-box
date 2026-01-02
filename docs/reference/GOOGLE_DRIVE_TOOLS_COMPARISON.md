# Google Drive MCP Tools Comparison

> Tools available in other Google Drive MCP implementations for review and selection

## isaacphi/mcp-gdrive (4 tools)

**Focus:** Drive + Sheets integration

1. **`gdrive_search`** - Search for files in Google Drive
   - Parameters: `query` (required), `pageToken` (optional), `pageSize` (optional, max 100)
   - Returns: File names and MIME types of matching files

2. **`gdrive_read_file`** - Read contents of a file from Google Drive
   - Parameters: `fileId` (required)
   - Returns: File contents (auto-exports Google Workspace files)

3. **`gsheets_read`** - Read data from a Google Spreadsheet
   - Parameters: `spreadsheetId` (required), `ranges` (optional array), `sheetId` (optional)
   - Returns: Spreadsheet data

4. **`gsheets_update_cell`** - Update a cell value in a Google Spreadsheet
   - Parameters: `fileId` (required), `range` (A1 notation), `value` (required)
   - Returns: Confirmation of updated value

**Resources:**
- `gdrive:///<file_id>` - Access files as MCP resources (auto-exports Google Workspace files)

---

## piotr-agier/google-drive-mcp (30+ tools)

**Focus:** Comprehensive Drive, Docs, Sheets, Slides integration

### File Management (8 tools)

1. **`search`** - Search for files across Google Drive
   - Parameters: `query` (required), `pageSize` (optional, max 100), `pageToken` (optional)
   - Returns: List of matching files

2. **`createTextFile`** - Create a new text or markdown file
   - Parameters: `name` (required, must end with .txt or .md), `content` (required), `parentFolderId` (optional)
   - Returns: Created file info

3. **`updateTextFile`** - Update an existing text or markdown file
   - Parameters: `fileId` (required), `content` (required), `name` (optional)
   - Returns: Updated file info

4. **`listFolder`** - List contents of a folder (defaults to root)
   - Parameters: `folderId` (optional), `pageSize` (optional, max 100), `pageToken` (optional)
   - Returns: Folder contents

5. **`createFolder`** - Create a new folder
   - Parameters: `name` (required), `parent` (optional - folder ID or path like "/Work/Projects")
   - Returns: Created folder info

6. **`deleteItem`** - Move a file or folder to trash (can be restored)
   - Parameters: `itemId` (required)
   - Returns: Confirmation

7. **`renameItem`** - Rename a file or folder
   - Parameters: `itemId` (required), `newName` (required)
   - Returns: Confirmation

8. **`moveItem`** - Move a file or folder
   - Parameters: `itemId` (required), `destinationFolderId` (optional, defaults to root)
   - Returns: Confirmation

### Google Docs (4 tools)

9. **`createGoogleDoc`** - Create a new Google Doc
   - Parameters: `name` (required), `content` (required), `parentFolderId` (optional)
   - Returns: Created doc info with link

10. **`updateGoogleDoc`** - Update an existing Google Doc
    - Parameters: `documentId` (required), `content` (required)
    - Returns: Confirmation

11. **`getGoogleDocContent`** - Get document content with text indices for formatting
    - Parameters: `documentId` (required)
    - Returns: Document content with character positions

12. **`formatGoogleDocText`** - Apply text formatting to a range in a Google Doc
    - Parameters: `documentId` (required), `startIndex` (required, 1-based), `endIndex` (required, 1-based), `bold`, `italic`, `underline`, `strikethrough`, `fontSize`, `foregroundColor` (all optional)
    - Returns: Confirmation

13. **`formatGoogleDocParagraph`** - Apply paragraph formatting to a range
    - Parameters: `documentId` (required), `startIndex` (required), `endIndex` (required), `namedStyleType` (HEADING_1, etc.), `alignment`, `lineSpacing`, `spaceAbove`, `spaceBelow` (all optional)
    - Returns: Confirmation

### Google Sheets (10 tools)

14. **`createGoogleSheet`** - Create a new Google Sheet
    - Parameters: `name` (required), `data` (required - 2D array), `parentFolderId` (optional)
    - Returns: Created sheet info

15. **`updateGoogleSheet`** - Update a Google Sheet
    - Parameters: `spreadsheetId` (required), `range` (required, A1 notation), `data` (required - 2D array)
    - Returns: Confirmation

16. **`getGoogleSheetContent`** - Get spreadsheet content with cell information
    - Parameters: `spreadsheetId` (required), `range` (required, A1 notation)
    - Returns: Cell values for the specified range

17. **`formatGoogleSheetCells`** - Format cell properties (background, alignment, wrapping)
    - Parameters: `spreadsheetId` (required), `range` (required), `backgroundColor`, `horizontalAlignment`, `verticalAlignment`, `wrapStrategy` (all optional)
    - Returns: Confirmation

18. **`formatGoogleSheetText`** - Apply text formatting to cells
    - Parameters: `spreadsheetId` (required), `range` (required), `bold`, `italic`, `strikethrough`, `underline`, `fontSize`, `fontFamily`, `foregroundColor` (all optional)
    - Returns: Confirmation

19. **`formatGoogleSheetNumbers`** - Apply number/date formatting
    - Parameters: `spreadsheetId` (required), `range` (required), `pattern` (required, e.g., '#,##0.00'), `type` (optional)
    - Returns: Confirmation

20. **`setGoogleSheetBorders`** - Configure cell borders
    - Parameters: `spreadsheetId` (required), `range` (required), `style` (required), `width`, `color`, `top`, `bottom`, `left`, `right`, `innerHorizontal`, `innerVertical` (all optional)
    - Returns: Confirmation

21. **`mergeGoogleSheetCells`** - Merge cells in a range
    - Parameters: `spreadsheetId` (required), `range` (required), `mergeType` (required)
    - Returns: Confirmation

22. **`addGoogleSheetConditionalFormat`** - Add conditional formatting rules
    - Parameters: `spreadsheetId` (required), `range` (required), `condition` (required), `format` (required)
    - Returns: Confirmation

### Google Slides (8 tools)

23. **`createGoogleSlides`** - Create a presentation
    - Parameters: `name` (required), `slides` (required - array with title/content), `parentFolderId` (optional)
    - Returns: Created presentation info

24. **`updateGoogleSlides`** - Update an existing presentation
    - Parameters: `presentationId` (required), `slides` (required - replaces all existing slides)
    - Returns: Confirmation

25. **`getGoogleSlidesContent`** - Get presentation content with element IDs
    - Parameters: `presentationId` (required), `slideIndex` (optional)
    - Returns: Element IDs for formatting

26. **`formatGoogleSlidesText`** - Apply text formatting to slide elements
    - Parameters: `presentationId` (required), `objectId` (required), `startIndex`, `endIndex`, `bold`, `italic`, `underline`, `strikethrough`, `fontSize`, `fontFamily`, `foregroundColor` (all optional)
    - Returns: Confirmation

27. **`formatGoogleSlidesParagraph`** - Apply paragraph formatting
    - Parameters: `presentationId` (required), `objectId` (required), `alignment`, `lineSpacing`, `bulletStyle` (all optional)
    - Returns: Confirmation

28. **`styleGoogleSlidesShape`** - Style shapes and elements
    - Parameters: `presentationId` (required), `objectId` (required), `backgroundColor`, `outlineColor`, `outlineWeight`, `outlineDashStyle` (all optional)
    - Returns: Confirmation

29. **`setGoogleSlidesBackground`** - Set slide background color
    - Parameters: `presentationId` (required), `pageObjectIds` (required - array), `backgroundColor` (required)
    - Returns: Confirmation

30. **`createGoogleSlidesTextBox`** - Create formatted text box
    - Parameters: `presentationId` (required), `pageObjectId` (required), `text` (required), `x`, `y`, `width`, `height` (all required, in EMU), `fontSize`, `bold`, `italic` (optional)
    - Returns: Created element ID

31. **`createGoogleSlidesShape`** - Create styled shape
    - Parameters: `presentationId` (required), `pageObjectId` (required), `shapeType` (required), `x`, `y`, `width`, `height` (all required), `backgroundColor` (optional)
    - Returns: Created element ID

**Resources:**
- `gdrive:///<file_id>` - Access files as MCP resources

---

## Your Current Implementation (3 tools)

Following consolidation philosophy - minimal set for memory sharing use case:

1. **`read_file`** - Read a file from Google Drive
   - Parameters: `fileId` (required)
   - Supports: Regular files and Google Docs (exports to markdown)

2. **`write_file`** - Write or update a file in Google Drive
   - Parameters: `fileName` (required), `content` (required), `fileId` (optional), `parentFolderId` (optional)
   - Creates new file if `fileId` not provided, updates existing if provided

3. **`list_files`** - List files in a folder
   - Parameters: `folderId` (optional), `query` (optional), `pageSize` (optional, default: 50, max: 100)
   - Filters to markdown/text files and Google Docs

---

## Tool Selection Recommendations

### For Memory Sharing Use Case (Current Focus)

**Already Implemented (3 tools):**
- ✅ `read_file` - Read .md files from Drive
- ✅ `write_file` - Write/update .md files to Drive
- ✅ `list_files` - List files to find context docs

**Potentially Useful Additions:**
- `search` - More powerful search across all Drive (not just folder)
- `createFolder` - Create folders for organizing context docs
- `moveItem` - Organize files into folders

### For Broader Use Cases (Future)

**If you need Google Docs support:**
- `createGoogleDoc` - Create Google Docs (not just .md files)
- `updateGoogleDoc` - Update Google Docs
- `getGoogleDocContent` - Get Docs with formatting info

**If you need Google Sheets support:**
- `createGoogleSheet` - Create spreadsheets
- `updateGoogleSheet` - Update spreadsheet data
- `getGoogleSheetContent` - Read spreadsheet data

**If you need file organization:**
- `renameItem` - Rename files
- `deleteItem` - Move to trash
- `moveItem` - Move files between folders

**If you need advanced formatting:**
- All the `format*` tools (probably overkill for memory sharing use case)

---

## Recommendation

**For your memory sharing use case, stick with the 3 tools you have:**
- ✅ `read_file` - Covers reading .md files and Google Docs (exports to markdown)
- ✅ `write_file` - Covers creating/updating .md files
- ✅ `list_files` - Covers finding context docs

**Consider adding these if needed:**
- `search` - If you need to search across entire Drive (not just a folder)
- `createFolder` - If you want to organize context docs into folders

**Skip these for now (following consolidation philosophy):**
- Google Sheets tools (not needed for memory sharing)
- Google Slides tools (not needed for memory sharing)
- Advanced formatting tools (overkill for .md files)
- File management tools beyond basic read/write/list (can be done manually)

---

## Next Steps

Review this list and let me know which tools you'd like to add. I'll implement them following your existing patterns (Cloudflare Workers compatible, OAuth broker integration, dual transport).

