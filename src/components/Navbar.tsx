"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur bg-background/70 border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold text-lg">大学生自救指南</Link>
        <div className="flex-1" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const usp = new URLSearchParams();
            if (q) usp.set("q", q);
            router.push(`/search?${usp.toString()}`);
          }}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-black focus-within:ring-2"
        >
          <Search size={18} />
          <input
            className="outline-none w-64 bg-transparent"
            placeholder="搜索资料/标签/描述"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="inline-flex items-center gap-1 px-3 py-2 rounded-md border hover:bg-neutral-100">
                  <LayoutDashboard size={16} /> 后台
                </Link>
              )}
              <button
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border hover:bg-neutral-100"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut size={16} /> 退出
              </button>
            </>
          ) : (
            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-md border hover:bg-neutral-100">
              <LogIn size={16} /> 登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
