import type { ComponentType } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconName = keyof typeof Icons;

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = Icons[name as IconName] as ComponentType<LucideProps> | undefined;
  if (!LucideIcon || name === "createLucideIcon") {
    return <Icons.Circle {...props} />;
  }
  return <LucideIcon {...props} />;
}
