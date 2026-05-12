export const runtime = "edge";

export async function GET() {
  try {
    await fetch("https://feriant-api.onrender.com/health");
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("error", { status: 500 });
  }
}
