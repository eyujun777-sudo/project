async function test() {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'Ov23liTjUpOj4R35f39b',
      device_code: 'add8fb15283f20a7e8444a8c9e9bf7901b087cd4',
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
