"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  type AnchorHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
} from "react";

type PrefetchLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  Omit<LinkProps, "href" | "prefetch"> & {
    href: string;
    prefetchOnHover?: boolean;
    prefetchOnFocus?: boolean;
  };

const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    {
      href,
      prefetchOnHover = true,
      prefetchOnFocus = true,
      onMouseEnter,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();

    const prefetch = useCallback(() => {
      try {
        const maybePromise = router.prefetch(href);

        if (maybePromise instanceof Promise) {
          maybePromise.catch(() => undefined);
        }
      } catch {
        // Ignorar erros de prefetch silenciosamente
      }
    }, [href, router]);

    const handleMouseEnter = useCallback(
      (event: MouseEvent<HTMLAnchorElement>) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented && prefetchOnHover) {
          prefetch();
        }
      },
      [onMouseEnter, prefetchOnHover, prefetch],
    );

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented && prefetchOnFocus) {
          prefetch();
        }
      },
      [onFocus, prefetchOnFocus, prefetch],
    );

    return (
      <Link
        {...props}
        href={href}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        prefetch={false}
      />
    );
  },
);

PrefetchLink.displayName = "PrefetchLink";

export { PrefetchLink };
