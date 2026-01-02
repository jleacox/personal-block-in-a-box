# PDF/Image Processing Strategy & Cost Analysis

## How Original Implementation Handled It

### Images
- ✅ **Sent directly to Claude Vision API** (base64 encoded)
- No text extraction needed
- Priority: Images processed first (line 1663-1674)
- Uses first/largest image if multiple

### PDFs  
- ❌ **Text extraction first** (PyPDF2/pdfplumber)
- Then sends extracted text to Claude API
- Limits to first 20k chars for performance
- Only processes if `pdf_parsed` flag is true

## Can Claude Handle PDFs Directly?

**Yes!** Claude API supports PDFs directly via the Files endpoint:
- Up to 30MB PDFs (100-200 pages)
- Files endpoint accepts up to 500MB
- Request size limit: 32MB total

**However**, the original implementation chose text extraction because:
1. **Cost**: Text is much smaller than PDF binary
2. **Speed**: Text extraction is fast, Claude processing is slower
3. **Focus**: Dates are usually in first few pages anyway

## Cost Analysis: Direct vs Text Extraction

### Scenario: 2MB attachments, several per week

**Assumptions:**
- 2MB image/PDF = ~2.67MB base64 (33% overhead)
- 2MB PDF → ~100KB extracted text (typical newsletter)
- Claude pricing: ~$3-15 per million input tokens
- 1 token ≈ 4 characters
- 2.67MB base64 ≈ 2.67M chars ≈ 667k tokens
- 100KB text ≈ 100k chars ≈ 25k tokens

### Option 1: Send Images/PDFs Directly to Claude

**Per 2MB attachment:**
- Input: ~667k tokens (2.67MB base64)
- Cost: ~$2-10 per attachment (at $3-15/M tokens)
- **Weekly (5 attachments):** ~$10-50/week

**Pros:**
- ✅ Simpler code (no PDF parsing)
- ✅ Claude handles layout, tables, images in PDF
- ✅ Better for complex PDFs with graphics

**Cons:**
- ❌ Much more expensive (20-25x more tokens)
- ❌ Slower (larger payloads)
- ❌ Hits Workers memory limits faster

### Option 2: Current Approach (Text Extraction)

**Per 2MB PDF:**
- PDF parsing: Free (local processing)
- Input: ~25k tokens (100KB text)
- Cost: ~$0.08-0.38 per attachment
- **Weekly (5 attachments):** ~$0.40-1.90/week

**Pros:**
- ✅ Much cheaper (20-25x less)
- ✅ Faster (smaller payloads)
- ✅ Works within Workers memory limits
- ✅ Matches original implementation

**Cons:**
- ❌ Loses layout/graphics from PDF
- ❌ Requires pdfjs-dist dependency
- ❌ More complex code

## Recommendation

**Keep current approach (text extraction for PDFs, direct for images):**

1. **Cost savings**: 20-25x cheaper for PDFs
2. **Performance**: Faster processing
3. **Workers compatibility**: Stays within memory limits
4. **Images already direct**: We're already doing the optimal thing for images

**Exception**: If PDFs have critical graphics/tables that text extraction misses, consider:
- Hybrid: Try text first, fallback to direct PDF if extraction fails
- Or: Add option to force direct PDF processing

## Implementation Notes

**Current code:**
- Images: ✅ Direct to Claude Vision API (already optimal)
- PDFs: ✅ Text extraction → Claude API (cost-effective)

**If we wanted direct PDF support:**
```typescript
// Would need to use Claude Files API
// Upload PDF first, then reference in message
// More complex, more expensive, but handles graphics
```

## Cost Summary

| Approach | Per 2MB PDF | Weekly (5 PDFs) | Annual |
|----------|------------|-----------------|--------|
| Direct PDF | $2-10 | $10-50 | $520-2,600 |
| Text Extract | $0.08-0.38 | $0.40-1.90 | $21-99 |

**Savings with text extraction: ~$500-2,500/year**

