"use client";

// ============================================================
//  ProfileShell - "ramkai" umumi baroi sahifai profil.
//
//  Peshtar in jo doghhoi rangin (aura) va fon-i khudash bud -
//  baroi hamin /profile az tamomi sayt farq mekard.
//  Instagram fon-i sof dorad. Hozir mo ham.
//
//  Sidebar in jo NEST - on YAK JOI ast (components/AppFrame.tsx)
//  va ba HAMAI sayt kor mekunad.
//
//  Andozahoi instagram: pahnii mazmun 935px.
// ============================================================
import { ProfileProvider } from "../providers";

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      {/* pt-[60px] - joi qatori boloi telefon;
          md:pl-[245px] - joi sidebar-i kompyuter;
          pb-[70px] - joi qatori poyoni telefon. */}
      <main className="min-h-dvh bg-[var(--bg)] pt-[60px] pb-[70px] md:pt-0 md:pb-10 md:pl-[245px]">
        <div className="mx-auto w-full max-w-[935px] px-4 md:px-5">{children}</div>
      </main>
    </ProfileProvider>
  );
}
