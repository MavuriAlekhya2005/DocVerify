const fs = require('fs');
const path = require('path');
const http = require('http');

// Test file upload using raw HTTP
const filePath = path.join(__dirname, 'backend/uploads/test-upload.txt');
const boundary = '----WebKitFormBoundary' + Date.now().toString(16);

const fileContent = fs.readFileSync(filePath);
const fileName = 'test-certificate.txt';

// Build multipart form data
let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="document"; filename="${fileName}"\r\n`;
body += 'Content-Type: text/plain\r\n\r\n';
body += fileContent.toString();
body += '\r\n';
body += `--${boundary}\r\n`;
body += 'Content-Disposition: form-data; name="title"\r\n\r\n';
body += 'Certificate of Achievement Test';
body += '\r\n';
body += `--${boundary}--\r\n`;

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('Parsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(body);
req.end();

console.log('Upload request sent...');
