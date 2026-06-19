import { FacebookIcon } from "@/components/icons/facebook-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, MailIcon } from "lucide-react";
import Link from "next/link";

const linkGroups = [
  {
    title: "Mua sắm",
    links: [
      { label: "Tất cả laptop", href: "/products" },
      { label: "Laptop Gaming", href: "/#gaming" },
      { label: "Laptop Doanh nhân", href: "/#business" },
      { label: "Laptop Học tập", href: "/#study" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Tài khoản của tôi", href: "/profile" },
      { label: "Liên hệ", href: "mailto:support@know.app" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="mb-10 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:flex sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-medium text-primary">Nâng cấp thiết bị của bạn</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight">
              Tìm laptop phù hợp cho công việc, gaming và cuộc sống.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Sản phẩm được chọn lọc kỹ càng, tư vấn thẳng thắn và giao hàng đáng tin cậy.
            </p>
          </div>
          <Button asChild className="mt-5 sm:mt-0">
            <Link href="/products">
              Xem laptop
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </section>

        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link className="inline-flex items-center gap-2" href="/">
              <Logo className="size-10" />
              <span className="text-xl font-bold">Know</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Laptop cho học tập, công việc, sáng tạo và gaming, đi kèm hỗ trợ thiết thực.
            </p>
            <a
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
              href="mailto:support@know.app"
            >
              <MailIcon className="size-4" />
              support@know.app
            </a>
          </div>
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      href={link.href}
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Know Cửa hàng Laptop.
          </p>
          <div className="flex gap-2">
            {[
              { label: "Facebook", icon: <FacebookIcon className="size-4" /> },
              { label: "YouTube", icon: <YoutubeIcon className="size-4" /> },
              { label: "Instagram", icon: <InstagramIcon className="size-4" /> },
            ].map((item) => (
              <Button
                aria-label={item.label}
                key={item.label}
                size="icon-sm"
                variant="outline"
              >
                {item.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
