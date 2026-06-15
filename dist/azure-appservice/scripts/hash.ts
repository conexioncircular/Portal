import argon2 from "argon2";
(async () => {
  const hash = await argon2.hash("Prueba123!");
  console.log(hash);
})();
