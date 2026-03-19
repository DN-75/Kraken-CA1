import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "ec_access_token";

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase env vars are missing" },
      { status: 500 }
    );
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!authRes.ok) {
    return redirectToLogin(req);
  }

  const authUser = (await authRes.json()) as { id?: string };
  if (!authUser.id) {
    return redirectToLogin(req);
  }

  const roleRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${authUser.id}&limit=1`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!roleRes.ok) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const profileRows = (await roleRes.json()) as Array<{ role?: string }>;
  const role = profileRows[0]?.role;

  if (role !== "admin") {
    if (req.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

