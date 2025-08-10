"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export interface ResourceCardProps {
  id: string;
  title: string;
  coverImageUrl?: string | null;
}

export default function ResourceCard({ id, title, coverImageUrl }: ResourceCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer select-none overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md"
      onClick={() => {
        if (!session?.user) {
          toast("请先登录", { icon: "🔒" });
          const callback = encodeURIComponent(`/resources/${id}`);
          router.push(`/login?callbackUrl=${callback}`);
          return;
        }
        router.push(`/resources/${id}`);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLDivElement).click();
      }}
    >
      <div className="aspect-[4/3] w-full bg-neutral-100">
        {coverImageUrl ? (
          // Use native img to avoid remotePatterns config for now
          <img src={coverImageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-neutral-400">无封面</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 group-hover:text-black">{title}</h3>
      </div>
    </motion.div>
  );
}
