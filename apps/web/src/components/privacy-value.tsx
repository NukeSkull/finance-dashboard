"use client";

import { ReactNode } from "react";

type PrivacyValueProps = {
  children: ReactNode;
  hidden: boolean;
  intensity?: "normal" | "strong";
  as?: "span" | "strong";
  className?: string;
};

export function PrivacyValue({
  children,
  hidden,
  intensity = "normal",
  as = "span",
  className
}: PrivacyValueProps) {
  const Component = as;
  const privacyClassName = `privacy-value${hidden ? " hidden" : ""}${intensity === "strong" ? " strong" : ""}`;

  return (
    <Component className={className ? `${privacyClassName} ${className}` : privacyClassName}>
      {children}
    </Component>
  );
}
