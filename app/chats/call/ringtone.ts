// ============================================================
//  app/chats/call/ringtone.ts
//  Sadoi zvanok. Fayli mp3 lozim NEST - sado bo WebAudio
//  soakhta meshavad (do-do-do), baroi hamin hech chiz bor
//  kardan lozim nest va hamesha kor mekunad.
// ============================================================

type Kind = "incoming" | "outgoing";

export class Ringer {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  private open(): AudioContext | null {
    if (this.ctx !== null) return this.ctx;

    const Ctor =
      typeof window === "undefined"
        ? undefined
        : window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

    if (Ctor === undefined) return null;

    try {
      this.ctx = new Ctor();
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Yak "beep"
  private beep(at: number, hz: number, seconds: number, volume: number) {
    const ctx = this.ctx;
    if (ctx === null) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = hz;

    // narm kushodan va narm khomush kardan (be "klik")
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.03);
    gain.gain.setValueAtTime(volume, at + seconds - 0.05);
    gain.gain.linearRampToValueAtTime(0, at + seconds);

    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + seconds + 0.02);
  }

  play(kind: Kind) {
    this.stop();

    const ctx = this.open();
    if (ctx === null) return;

    if (ctx.state === "suspended") void ctx.resume();

    const cycle = () => {
      const now = ctx.currentTime;

      if (kind === "incoming") {
        // du beepi baland - "ba tu zang omad"
        this.beep(now, 660, 0.32, 0.16);
        this.beep(now + 0.42, 880, 0.32, 0.16);
      } else {
        // yak beepi past - "sabr kuned, zang meravad"
        this.beep(now, 420, 0.5, 0.09);
      }
    };

    cycle();
    this.timer = setInterval(cycle, kind === "incoming" ? 2000 : 2600);
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stop();
    try {
      void this.ctx?.close();
    } catch {
      // guzoshtan
    }
    this.ctx = null;
  }
}
