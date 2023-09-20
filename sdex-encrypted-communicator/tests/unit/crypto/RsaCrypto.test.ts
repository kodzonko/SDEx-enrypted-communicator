import { decryptRsa, encryptRsa } from "../../../src/crypto/RsaCrypto";
import { RsaEncryptionError } from "../../../src/Errors";

test.skip("Encrypting and decrypting text with RSA key pair.", async () => {
  const publicKey = `-----BEGIN RSA PUBLIC KEY-----
  MIIBCgKCAQEAqt7XmmXprVIPhPMOdFwJg2BYlw47yLq6eZABd+k9hTA691Mmtanl
  T8ImJ1KGV/pyPQYeqpwkDlf8Q/yAwOoGvhgCWqr65WHxCCA0ByxklXiRFeBhe4/W
  LfrANzRYXysPpKF33XiGPhTaT2BCMNHsVcI1Bl4HqblmPeSwYloX7HMHjdF5RP3T
  vGF8TXQ9Ad/omgZw5jUoYVulkkN3f1FDhWHuD16p3n1qDFJZkSndeA53FkrnoWzt
  E39RGIBgmKorMONkRMlaLH3KfWVrAxNTfBG6vTlPCk1HbjPGmghLkMo1rGg0SPrv
  oOislFltE6nLyeGfL8IeAZU6gr1FdTQUBwIDAQAB
  -----END RSA PUBLIC KEY-----
  `;
  const privateKey = `-----BEGIN RSA PRIVATE KEY-----
  MIIEowIBAAKCAQEAqt7XmmXprVIPhPMOdFwJg2BYlw47yLq6eZABd+k9hTA691Mm
  tanlT8ImJ1KGV/pyPQYeqpwkDlf8Q/yAwOoGvhgCWqr65WHxCCA0ByxklXiRFeBh
  e4/WLfrANzRYXysPpKF33XiGPhTaT2BCMNHsVcI1Bl4HqblmPeSwYloX7HMHjdF5
  RP3TvGF8TXQ9Ad/omgZw5jUoYVulkkN3f1FDhWHuD16p3n1qDFJZkSndeA53Fkrn
  oWztE39RGIBgmKorMONkRMlaLH3KfWVrAxNTfBG6vTlPCk1HbjPGmghLkMo1rGg0
  SPrvoOislFltE6nLyeGfL8IeAZU6gr1FdTQUBwIDAQABAoIBAAPslyE8aCqSLXJm
  NUdxD3Q0SSLJo1cvtG5sDcrNNLhFOqAel6TFwIwBC+ia1iRZVapPyBz2EmCUnvAW
  /8tR+CflBpjQsVLa2aSzr740Na+Z/lzKeqRutXRNw4BWZdy5qgBOleiWMZKeiVCJ
  zvQ89txOrUe9tftXqZKQGN3QfTV/zupQH2EqaiKWf31GuusscL5fvwlBvCM3A/VG
  ya8WAb3hPVUjgSuvsWKrPC1G9gc4F+5Y5eA/Tvm0UEaz5EsG7VZerZXgtN32vzUN
  1qI2eOajQoT9Y7u0U/SnCL3xFJtcaVZy0S380E+qeanKGtheZNs4IcNXFnIgPRwu
  WddKBDECgYEA6JPR63K7IZ/+yPZEfq9WVjzH+ViUveoLM6KQAqtxc8AXzNRSchlK
  7YDpWQjYYmA7ZdwLO1Dv9PxE0AHmvrZAu4vn1QI5ZsAaH62WNqrOORpHEW9sIjab
  PdKdjz6r600KlB7iHb0RZBw3wiO9ONS4t2ikfaBTKZvOdKfKTzdyoh0CgYEAvBQg
  59LwJv+DpYHl0R+70XXXm6FNGcJCQrdBoxMzA3Vok7q8OWt4m10AzX6s6rcUttrv
  PZnNWDm+ryQttA9L2sSKZxANsEuIn2SgurR1QZPrzTTe7h/Ypf8qQdmFJDSbkTEL
  sEgkpY34A02clmZq/mjuuVR588Z/DOsHaAi2dXMCgYEAuPPciwV5JRtMDVoyTCB5
  YykAyhyUZJa7g7tyFH1sQmVvR9dNHSlZ+Zd7ee9bzJfEhJNBZ1FNEaCPxG7Opbjf
  r4Vpvm3/YePAopJzk1OvnZ91Brt53ZdZSwezfpeTNhLVJ8eLf6S8MMVz3fJ35rrb
  jhcsQC8AE2Ww//nzG533jk0CgYAb4JfoBLoX7bOjqpdX4e5C48ariMMW2FZd8S/H
  bicXkiWIEBuqHyXnUWe3DdmviKeHWvgvF0b6lsSOzTwA/mtt58fj8ts0kF2V0qKI
  Sgs/Rx+icP3CKfJA2It46zby4OFWKgDjhi34ZAyo4K4fFNszDnaj/cN9wKRAU+3r
  G69/xQKBgBK4jgPmafgKnvL+UnabxllDaNo1vtaPUJp991qWjkU0mwcYchJEghv/
  HyMhe/tzrWq0jIhxLRo/FMCFnbEcXDJALtPRrwDtBBlFOprTOXgbDyldGqB9vA4t
  o0tR5T5WQ+lcw5Cz+BOtLOTjY0Wx1A4OclwmmiDQgEdwE+jKnLXS
  -----END RSA PRIVATE KEY-----
  `;
  const testMessage = "This is a test";
  const encryptedText = await encryptRsa(publicKey, testMessage);
  // Because the algorithm isn't idempotent, we can't compare the encrypted text with a known value.
  expect(encryptedText).toBeTruthy();
  const decryptedText = await decryptRsa(privateKey, encryptedText);
  expect(decryptedText).toBe(testMessage);
});

test.skip("Encrypting text with public RSA key raises error due to wrong RSA key.", () => {
  const rsaKey = `-----BEGIN RSA PUBLIC KEY-----
  wrong key
  -----END RSA PUBLIC KEY-----`;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  expect(async () => {
    await encryptRsa(rsaKey, "Hello World");
  }).rejects.toThrow(RsaEncryptionError);
});
