import { Feed } from "@/components/Feed";
import { RightRail } from "@/components/RightRail";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[975px] justify-center gap-0 px-2 py-4 md:px-5 md:py-6">
      <Feed />
      <RightRail />
    </div>
  );
}
