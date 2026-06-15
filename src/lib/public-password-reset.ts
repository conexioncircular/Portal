import * as argon2 from "argon2";
import { getPool } from "./db";

function normalizeIdentifier(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePassword(value: unknown): string {
  const password = String(value ?? "");

  if (password.length < 8) {
    throw new Error("La contrasena debe tener al menos 8 caracteres");
  }

  return password;
}

export async function resetPasswordByIdentifier(
  identifier: unknown,
  password: unknown
): Promise<void> {
  const safeIdentifier = normalizeIdentifier(identifier);
  const safePassword = normalizePassword(password);

  if (!safeIdentifier) {
    throw new Error("Debes ingresar tu correo.");
  }

  const pool = await getPool();
  const userResult = await pool
    .request()
    .input("identifier", safeIdentifier)
    .query(/* sql */ `
      SELECT TOP 1
        u.UserId AS userId
      FROM auth.Users u
      WHERE u.Email = @identifier
        AND ISNULL(u.IsActive, 0) = 1
    `);

  const userId = userResult.recordset?.[0]?.userId;
  if (!userId) {
    throw new Error("No encontramos un usuario activo con ese correo.");
  }

  const passwordHash = await argon2.hash(safePassword);
  await pool
    .request()
    .input("userId", String(userId))
    .input("passwordHash", passwordHash)
    .input("passwordAlgo", "argon2")
    .query(/* sql */ `
      UPDATE auth.Users
      SET PasswordHash = @passwordHash,
          PasswordAlgo = @passwordAlgo
      WHERE UserId = @userId
    `);
}
