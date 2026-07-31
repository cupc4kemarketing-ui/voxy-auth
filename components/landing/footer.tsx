import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { DiscordIcon, GithubIcon, TwitterXIcon } from "@/components/shared/social-icons";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Download", href: "/login" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Redeem Key", href: "/dashboard/redeem" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: "https://discord.com" },
      { label: "Twitter / X", href: "https://twitter.com" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[220px] text-sm text-muted-foreground">
              The modern utility client for Minecraft.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground transition-colors hover:bg-accent hover:text-white"
              >
                <DiscordIcon className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground transition-colors hover:bg-accent hover:text-white"
              >
                <TwitterXIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-muted-foreground transition-colors hover:bg-accent hover:text-white"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Voxy Client. All rights reserved.</p>
          <p>Not affiliated with Mojang Studios or Microsoft.</p>
        </div>
      </div>
    </footer>
  );
}
