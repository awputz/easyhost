'use client'

import { motion } from 'framer-motion'

interface GlowBackgroundProps {
  className?: string
  showNoise?: boolean
  intensity?: 'low' | 'medium' | 'high'
}

export function GlowBackground({
  className = '',
  showNoise = true,
  intensity = 'medium'
}: GlowBackgroundProps) {
  const opacityMap = {
    low: { primary: 0.04, secondary: 0.02 },
    medium: { primary: 0.08, secondary: 0.03 },
    high: { primary: 0.12, secondary: 0.05 }
  }

  const opacity = opacityMap[intensity]

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary glow - Apple blue accent */}
      <motion.div
        className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0,113,227,${opacity.primary}) 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Secondary glow - Subtle white */}
      <motion.div
        className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,${opacity.secondary}) 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Tertiary glow - Top right corner */}
      <motion.div
        className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,${opacity.secondary * 0.5}) 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Noise texture overlay for premium feel */}
      {showNoise && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  )
}

// Simplified version for use in sections
export function SectionGlow({ position = 'left' }: { position?: 'left' | 'right' | 'center' }) {
  const positionStyles = {
    left: 'left-0 -translate-x-1/2',
    right: 'right-0 translate-x-1/2',
    center: 'left-1/2 -translate-x-1/2'
  }

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none ${positionStyles[position]}`}
      style={{
        background: 'radial-gradient(circle, rgba(0,113,227,0.06) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }}
    />
  )
}

// Gradient orb component for decorative use
export function GradientOrb({
  className = '',
  color = 'blue',
  size = 'medium'
}: {
  className?: string
  color?: 'blue' | 'white' | 'purple'
  size?: 'small' | 'medium' | 'large'
}) {
  const colorMap = {
    blue: 'rgba(0,113,227,0.1)',
    white: 'rgba(255,255,255,0.05)',
    purple: 'rgba(147,51,234,0.1)'
  }

  const sizeMap = {
    small: 'w-[200px] h-[200px]',
    medium: 'w-[400px] h-[400px]',
    large: 'w-[600px] h-[600px]'
  }

  return (
    <motion.div
      className={`rounded-full pointer-events-none ${sizeMap[size]} ${className}`}
      style={{
        background: `radial-gradient(circle, ${colorMap[color]} 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}
