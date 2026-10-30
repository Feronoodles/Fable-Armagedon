import test from "node:test";
import assert from "node:assert/strict";
import { parseRegistration, RegistrationValidationError, registrationErrorMessage } from "../src/lib/registration-validation";

const valid = { username: "Duelista", email: "duelista@example.com", password: "BattlePass123" };
const invalid = (body: unknown, code: RegistrationValidationError["code"]) =>
  assert.throws(() => parseRegistration(body), (error: unknown) => error instanceof RegistrationValidationError && error.code === code);

test("registration normalizes username and email while keeping the exact password", () => {
  const password = "  password with spaces  ";
  assert.deepEqual(parseRegistration({ username: "  Duelista  ", email: " PLAYER@Example.COM  ", password }),
    { username: "Duelista", email: "player@example.com", password });
});

test("registration rejects null, arrays and primitive request bodies", () => {
  for (const body of [null, undefined, [], [valid], "text", 12, false]) invalid(body, "BODY");
});

test("registration requires string fields instead of coercing objects or numbers", () => {
  for (const value of [null, undefined, 12345678, true, {}, []]) {
    invalid({ ...valid, username: value }, "USERNAME");
    invalid({ ...valid, email: value }, "EMAIL");
    invalid({ ...valid, password: value }, "PASSWORD");
  }
});

test("registration checks username bounds after trimming", () => {
  for (const username of ["", "   ", " ab ", "a".repeat(33)]) invalid({ ...valid, username }, "USERNAME");
  assert.equal(parseRegistration({ ...valid, username: " abc " }).username, "abc");
  assert.equal(parseRegistration({ ...valid, username: "a".repeat(32) }).username.length, 32);
});

test("registration checks email structure and maximum normalized length", () => {
  for (const email of ["", "example.com", "a@localhost", "a b@example.com", "a@@example.com", "a@ example.com", "a".repeat(243) + "@example.com"])
    invalid({ ...valid, email }, "EMAIL");
  assert.equal(parseRegistration({ ...valid, email: "a".repeat(242) + "@example.com" }).email.length, 254);
});

test("passwords need eight actual characters without stripping whitespace", () => {
  invalid({ ...valid, password: "1234567" }, "PASSWORD");
  invalid({ ...valid, password: "😀".repeat(7) }, "PASSWORD");
  assert.equal(parseRegistration({ ...valid, password: " pass12 " }).password, " pass12 ");
  assert.equal(parseRegistration({ ...valid, password: "😀".repeat(8) }).password, "😀".repeat(8));
});

test("passwords are rejected before bcrypt would silently truncate beyond 72 UTF-8 bytes", () => {
  for (const password of ["a".repeat(72), "é".repeat(36), "😀".repeat(18)])
    assert.equal(parseRegistration({ ...valid, password }).password, password);
  for (const password of ["a".repeat(73), "é".repeat(37), "😀".repeat(19), "é".repeat(36) + "a"])
    invalid({ ...valid, password }, "PASSWORD");
});

test("registration validation messages can be presented in English and Spanish", () => {
  const error = new RegistrationValidationError("PASSWORD");
  assert.match(registrationErrorMessage(error, "en"), /at least 8 characters/);
  assert.match(registrationErrorMessage(error, "es"), /al menos 8 caracteres/);
  assert.equal(registrationErrorMessage(error, "fr"), error.message);
});
