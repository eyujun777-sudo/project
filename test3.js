async function test() {
  const res = await fetch('http://localhost:5173/gh-api/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'Ov23liTjUpOj4R35f39b',
      device_code: 'test',
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
