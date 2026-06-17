export function validateSignup({ name, email } = {}) {
  const errors = [];

  if (!name) {
    errors.push("name is required");
  }
  if (!email) {
    errors.push("email is required");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
