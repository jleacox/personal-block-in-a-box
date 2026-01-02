# Extract Dates from Email - Technical Explanation

## How Claude API Works with PDFs vs Images

### Key Difference

**Claude API does NOT accept PDF files directly.** It only accepts text content. This is why we need PDF parsing.

### Image Attachments
- ✅ **Direct support**: Claude Vision API accepts base64-encoded images directly
- No parsing needed - just send the image data
- Works with: PNG, JPG, JPEG, GIF, WEBP

### PDF Attachments  
- ⚠️ **Direct support exists but not used**: Claude API Files endpoint CAN process PDFs directly (up to 30MB)
- ✅ **Original chose text extraction**: Much cheaper (20-25x less tokens) and faster
- **Why text extraction**: 2MB PDF → ~100KB text = huge cost savings
- Requires: PDF parsing library (pdfjs-dist in TypeScript, PyPDF2/pdfplumber in Python)

## Flow Comparison

### Python Version (Original)
```
PDF Attachment → PyPDF2/pdfplumber → Extract Text → Send Text to Claude API
Image Attachment → Base64 Encode → Send Directly to Claude Vision API
```

### TypeScript/Workers Version (Our Implementation)
```
PDF Attachment → pdfjs-dist → Extract Text → Send Text to Claude API  
Image Attachment → Base64 Encode → Send Directly to Claude Vision API
```

## Why We Need PDF Parsing

The original Python code shows this clearly:

```python
# From server.py line 1826-1828
pdf_text = parse_pdf(file_data)  # Extract text first
attachment_info['pdf_content'] = pdf_text  # Store text
# Later, send pdf_text (not PDF file) to Claude
```

Then at line 1689:
```python
claude_result = await parse_pdf_with_claude(
    pdf_content_limited,  # TEXT, not PDF file!
    email_subject,
    email_date
)
```

The `parse_pdf_with_claude` function accepts `pdf_content: str` (text), not a PDF file.

## Cloudflare Workers & API Tokens

### How ANTHROPIC_API_KEY Works

1. **Local Development (Cursor/Node.js)**:
   - Set as environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
   - Accessed via `process.env.ANTHROPIC_API_KEY`
   - Works in stdio transport (`index.ts`)

2. **Cloudflare Workers**:
   - Set as Worker secret: `wrangler secret put ANTHROPIC_API_KEY`
   - Accessed via `env.ANTHROPIC_API_KEY` in Worker
   - Works in HTTP transport (`worker.ts`)

3. **In Code**:
   ```typescript
   const apiKey = typeof process !== 'undefined' 
     ? process.env.ANTHROPIC_API_KEY  // Node.js
     : env?.ANTHROPIC_API_KEY;        // Workers
   ```

### Token Security

- **Never commit tokens** to git
- **Use secrets** in Workers (`wrangler secret put`)
- **Use .env.local** for local dev (gitignored)

## PDF Parsing Implementation

### Python Libraries (Original)
- `PyPDF2` - Fast text extraction
- `pdfplumber` - Better for complex PDFs, handles tables better

### TypeScript/Workers (Our Version)
- `pdfjs-dist` - Mozilla's PDF.js, Workers-compatible
- Extracts text similar to PyPDF2
- Limited to first 10 pages (dates usually in first pages)
- Stops early if >20k chars extracted (performance)

## Summary

**Why PDF parsing is needed:**
- Claude API only accepts text, not PDF files
- Images can be sent directly (Claude Vision API)
- PDFs must be parsed to text first

**Library differences:**
- Python: PyPDF2/pdfplumber
- TypeScript/Workers: pdfjs-dist

**API Token:**
- Local: Environment variable
- Workers: `wrangler secret put ANTHROPIC_API_KEY`
- Same token, different access method

## Usage Limitations

### ⚠️ Cannot Use Gmail URLs Directly

**Important:** The `extract_dates_from_email` tool requires a Gmail API `messageId`, not a Gmail web URL.

**What doesn't work:**
- ❌ Gmail web URLs: `https://mail.google.com/mail/u/0/#inbox/19b637f4701b695e`
- ❌ Pasting email links from Gmail web interface

**What works:**
- ✅ Use `search_emails` first to find the email, then use the `messageId` from results
- ✅ Provide search criteria (subject, from, date range) to locate the email, then extract dates
- ✅ The `messageId` is the Gmail API message ID (e.g., `19b637f4701b695e`)

**Example workflow:**
1. Search for email: `search_emails({ query: "subject:PAC Newsletter" })`
2. Get `messageId` from results: `19b637f4701b695e`
3. Extract dates: `extract_dates_from_email({ messageId: "19b637f4701b695e" })`

