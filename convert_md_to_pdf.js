const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const marked = require('marked');

// 마크다운을 HTML로 변환하는 함수
function markdownToHtml(markdown) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>신일제약 실적관리 시스템 문서</title>
    <style>
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
            margin-bottom: 20px;
            font-size: 28px;
        }
        
        h2 {
            color: #34495e;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 24px;
        }
        
        h3 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 20px;
        }
        
        h4 {
            color: #34495e;
            margin-top: 15px;
            margin-bottom: 8px;
            font-size: 18px;
        }
        
        p {
            margin-bottom: 12px;
            text-align: justify;
        }
        
        code {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        
        pre {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
            margin: 15px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin: 15px 0;
            padding: 10px 20px;
            background-color: #f8f9fa;
            font-style: italic;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 14px;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        .highlight {
            background-color: #fff3cd;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 15mm;
            }
            
            h1, h2, h3, h4 {
                page-break-after: avoid;
            }
            
            pre, blockquote, table {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${marked.parse(markdown)}
</body>
</html>`;
}

// PDF 생성 함수
async function generatePDF(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true,
    displayHeaderFooter: false
  });
  
  await browser.close();
  console.log(`PDF 생성 완료: ${outputPath}`);
}

// 메인 실행 함수
async function convertMarkdownToPDF() {
  const files = [
    'sinil_edi_1_develop_summary.md',
    'sinil_edi_2_data_structure.md',
    'sinil_edi_3_main_logic.md'
  ];
  
  const inputDir = path.join(__dirname, 'public', 'docs');
  const outputDir = path.join(__dirname, 'public', 'docs');
  
  for (const file of files) {
    try {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.md', '.pdf'));
      
      // 마크다운 파일 읽기
      const markdown = fs.readFileSync(inputPath, 'utf8');
      
      // HTML로 변환
      const html = markdownToHtml(markdown);
      
      // PDF 생성
      await generatePDF(html, outputPath);
      
    } catch (error) {
      console.error(`오류 발생 (${file}):`, error.message);
    }
  }
  
  console.log('모든 파일 변환 완료!');
}

// 스크립트 실행
convertMarkdownToPDF().catch(console.error); 