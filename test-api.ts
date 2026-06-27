import http from 'http';

const data = JSON.stringify({
  sessionId: "test",
  loginTime: 123,
  logoutTime: null,
  activeTime: 0,
  status: "active"
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/sessions/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
