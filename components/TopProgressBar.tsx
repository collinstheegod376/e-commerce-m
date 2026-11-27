"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NextTopLoader, { useTopLoader } from "nextjs-toploader";

function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  useEffect(() => {
    // Whenever pathname or searchParams change, ensure the progress bar completes smoothly
    loader.done();
  }, [pathname, searchParams, loader]);

  return null;
}

export function TopProgressBar() {
  return (
    <>
      <NextTopLoader
        color="#ff660c"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #ff660c, 0 0 5px #ff660c"
        zIndex={99999}
        showForHashAnchor={false}
      />
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>
    </>
  );
}

export default TopProgressBar;
