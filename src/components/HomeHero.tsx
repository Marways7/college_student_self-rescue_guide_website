"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type Transition } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface HomeHeroProps {
  siteName: string;
  siteDescription: string;
}

export default function HomeHero({ siteName, siteDescription }: HomeHeroProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      ease: "easeInOut" as const,
      repeat: Infinity,
    } as Transition,
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y }}
      >
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20"
          animate={floatAnimation}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20"
          animate={{
            y: [0, -10, 0],
            transition: {
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 2,
            } as Transition,
          }}
        />
      </motion.div>

      {/* Floating Icons */}
      <motion.div
        className="absolute top-1/4 right-1/4 text-purple-500 opacity-20"
        animate={floatAnimation}
      >
        <Sparkles size={40} />
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 left-1/4 text-blue-500 opacity-20"
        animate={{
          y: [0, -10, 0],
          transition: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 1,
          } as Transition,
        }}
      >
        <Zap size={40} />
      </motion.div>
      <motion.div
        className="absolute top-1/3 left-1/3 text-pink-500 opacity-20"
        animate={{
          y: [0, -10, 0],
          transition: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 1.5,
          } as Transition,
        }}
      >
        <Shield size={40} />
      </motion.div>

      <motion.div
        className="container-fluid relative z-10"
        style={{ opacity }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div
          variants={staggerItem}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium">全新升级 SOTA 体验</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
        >
          <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            {siteName}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={staggerItem}
          className="text-lg md:text-xl text-foreground-muted max-w-2xl mb-12"
        >
          {siteDescription}
          <br />
          <span className="text-sm opacity-80">
            更快找到 · 更可信 · 更便捷
          </span>
        </motion.p>

        {/* Stats */}
        <motion.div
          variants={staggerItem}
          className="flex gap-8 mb-12"
        >
          {[
            { label: "学习资料", value: "1000+" },
            { label: "活跃用户", value: "5000+" },
            { label: "每日更新", value: "50+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-foreground-subtle">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={staggerItem}
          className="flex flex-wrap gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/search" className="btn btn-primary group">
              立即搜索
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/categories" className="btn btn-glass">
              浏览分类
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/resources" className="btn btn-glass">
              所有资料
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          variants={staggerItem}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-foreground-muted rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-foreground-muted rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
