export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://v0-farcaster-troll-box-app.vercel.app";

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjM0NDExMSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDJiNzkxOGZGNGNDNDBhNzU2M2Q1NzdmQ0I0YzREMkEzRkUxMzEwMjEifQ",
      payload: "eyJkb21haW4iOiJ2MC1mYXJjYXN0ZXItdHJvbGwtYm94LWFwcC52ZXJjZWwuYXBwIn0",
      signature:
        "BJaZWJ43x19ee7M8ei06sjlmRrqyAAkaO62xO0rKIZ18M5AAP2LWN4UgGO7M3l1vjCLLfpK/QYVsk1MN/aT/rxw=",
    },
    frame: {
      version: "next",
      name: "TrollBox",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/troll-banner.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#9E75FF",
    },
  };

  return Response.json(config);
}
