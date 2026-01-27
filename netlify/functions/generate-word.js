const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        console.log('Word generation function called');
        
        const { html, metadata } = JSON.parse(event.body);
        
        if (!html) {
            throw new Error('No HTML content provided');
        }
        
        console.log('HTML length:', html.length);
        
        const paragraphs = parseHTMLToDocx(html);
        
        paragraphs.push(
            new Paragraph({ text: '' }),
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
                text: 'Generated: ' + new Date().toLocaleDateString('en-AU') + ' at ' + new Date().toLocaleTimeString('en-AU'),
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'Document ID: ' + (metadata.documentId || 'N/A') + ' | User: ' + (metadata.userName || 'Unknown'),
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: '' }),
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
        
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720,
                            right: 720,
                            bottom: 720,
                            left: 720
                        }
                    }
                },
                children: paragraphs
            }]
        });
        
        console.log('Document created, generating buffer...');
        
        const buffer = await Packer.toBuffer(doc);
        
        console.log('Buffer generated, size:', buffer.length);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="' + (metadata.filename || 'document.docx') + '"',
                'Access-Control-Allow-Origin': '*'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('Error in generate-word function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message,
                stack: error.stack 
            })
        };
    }
};

function parseHTMLToDocx(html) {
    const paragraphs = [];
    
    html = html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
    
    const tagRegex = /<(h1|h2|h3|p|li)>(.*?)<\/\1>/gi;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        const text = match[2]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
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


