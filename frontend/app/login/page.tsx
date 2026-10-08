import Image from "next/image";
import { MapPin } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1674556275226-47b6b393d623?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-7 text-body text-ink">
      <div className="flex w-full max-w-[1120px] flex-wrap gap-3 rounded-xl border border-line bg-card p-3">
        <div className="relative flex min-h-[260px] flex-[1_1_360px] flex-col justify-between overflow-hidden rounded-[14px] bg-lime-soft p-7">
          <Image
            src={HERO_IMAGE}
            alt="Mother and calf elephant grazing in Udawalawe National Park"
            fill
            priority
            sizes="(min-width: 1120px) 560px, 100vw"
            className="object-cover object-[30%_center]"
          />
          <p className="relative m-0 max-w-[340px] text-page-title">Every herd, patrol and alert in one calm view.</p>
          <span className="relative inline-flex items-center gap-1.5 self-start rounded-xs border border-line bg-card px-2 py-1 text-caption font-medium">
            <MapPin className="size-3.5" strokeWidth={1.8} />
            Udawalawe NP · 30,821 ha
          </span>
        </div>
        <div className="flex flex-[1_1_360px] items-center justify-center px-6 py-10">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
