export function fetchProfile(provider, username) {
  if (provider !== "github") {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return {
    provider: "github",
    url: `https://github.com/${username}`,
  };
}
