async function test() {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'Ov23liTjUpOj4R35f39b',
      scope: 'read:user'
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
