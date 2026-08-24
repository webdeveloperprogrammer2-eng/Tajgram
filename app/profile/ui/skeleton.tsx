// ============================================================
//  Skeleton - az shadcn/ui.
//  Vaqte ma'lumot hanuz az server nayomadaast, ba joi on
//  yak chorchubai khoki namoyon meshavad.
// ============================================================
import * as React from "react";

import { cn } from "./utils";
import styles from "../profile.module.css";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(styles.skeleton, className)}
      {...props}
    />
  );
}

export { Skeleton };
