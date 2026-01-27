const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

exports.handler = async (event) => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        console.log('📝 Word generation function called');
        
        // Parse request body
        const { html, metadata } = JSON.parse(event.body);
        
        if (!html) {
            throw new Error('No HTML content provided');
        }
        
        console.log('📝 HTML length:', html.length);
        console.log('📝 Metadata:', metadata);
        
        // Parse HTML and convert to Word paragraphs
        const paragraphs = parseHTMLToDocx(html);
        
        // Add footer
        paragraphs.push(
            new Paragraph({ text: '' }), // Spacer
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'FITZGERALD HR - AI-Powered Hospitality HR Solutions',
                        bold: true,
                        size: 20
                    })
                ],
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'Email: info@fitzgeraldhr.com.au | Phone: +61 400 211 014',
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: `Generated: ${new Date().toLocaleDateString('en-AU')} at ${new Date().toLocaleTimeString('en-AU')}`,
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: `Document ID: ${metadata.documentId || 'N/A'} | User: ${metadata.userName || 'Unknown'}`,
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: '' }), // Spacer
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'WARNING: DRAFT TEMPLATE - Requires professional review before use',
                        bold: true,
                        color: 'FF0000',
                        size: 20
                    })
                ],
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'For personalised advice, contact our Senior Consultants.',
                alignment: AlignmentType.CENTER
            })
        );
        
        // Create Word document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720,    // 0.5 inch
                            right: 720,
                            bottom: 720,
                            left: 720
                        }
                    }
                },
                children: paragraphs
            }]
        });
        
        console.log('📝 Document created, generating buffer...');
        
        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        
        console.log('✅ Buffer generated, size:', buffer.length);
        
        // Return as base64 (required for Netlify Functions)
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${metadata.filename || 'document.docx'}"`,
                'Access-Control-Allow-Origin': '*' // Enable CORS
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('❌ Error in generate-word function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message,
                stack: error.stack 
            })
        };
    }
};

/**
 * Parse HTML string and convert to docx Paragraph objects
 * Handles h1, h2, h3, p, li tags
 */
function parseHTMLToDocx(html) {
    const paragraphs = [];
    
    // Remove XML entities that might break parsing
    html = html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
    
    // Split by tags and process
    const tagRegex = /<(h1|h2|h3|p|li)>(.*?)<\/\1>/gi;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        const text = match[2]
            .replace(/<[^>]*>/g, '') // Remove any nested tags
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
        
        if (!text) continue;
        
        switch (tag) {
            case 'h1':
                paragraphs.push(new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
                break;
                
            case 'h2':
                paragraphs.push(new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
                break;
                
            case 'h3':
                paragraphs.push(new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
                break;
                
            case 'p':
                paragraphs.push(new Paragraph({
                    children: [new TextRun(text)],
                    spacing: { after: 200 }
                }));
                break;
                
            case 'li':
                paragraphs.push(new Paragraph({
                    text: text,
                    bullet: { level: 0 },
                    spacing: { after: 100 }
                }));
                break;
        }
    }
    
    return paragraphs;
}
```

**Then:**
1. **Paste it into Notepad** (Right-click → Paste, or Ctrl+V)
2. Click **File** → **Save**
3. **Close Notepad**

---

**When you're done, type in Command Prompt:**
```
dir netlify\functions