"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BookOpen, TrendingUp, Users, Lightbulb } from "lucide-react"

interface SlideData {
  id: number
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  image: string
}

const slides: SlideData[] = [
  {
    id: 1,
    title: "Knowledge Base",
    subtitle: "Comprehensive Insights",
    description: "Access in-depth articles, research papers, and expert analysis on complex topics that matter to you.",
    icon: <BookOpen className="w-8 h-8" />,
    image: "/video-clips/hero-4.jpg",
  },
  {
    id: 2,
    title: "Political Insights",
    subtitle: "Stay Informed",
    description: "Get the latest political analysis, policy breakdowns, and expert commentary on current events.",
    icon: <TrendingUp className="w-8 h-8" />,
    image: "/video-clips/hero-3.JPG",
  },
  {
    id: 3,
    title: "Community Driven",
    subtitle: "Expert Contributors",
    description: "Join a community of thought leaders, researchers, and experts sharing valuable insights.",
    icon: <Users className="w-8 h-8" />,
    image: "/video-clips/hero-2.JPG",
  },
  {
    id: 4,
    title: "Fresh Perspectives",
    subtitle: "Innovative Ideas",
    description: "Discover new viewpoints and innovative solutions to today's most pressing challenges.",
    icon: <Lightbulb className="w-8 h-8" />,
    image: "/video-clips/hero-1.jpg",
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col items-center text-center space-y-12 min-h-[80vh] justify-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6 text-white">
              <div className="flex items-center justify-center gap-3 animate-float">
                <div className="p-3 bg-yellow-400/20 rounded-full backdrop-blur-sm border border-yellow-400/30">
                  {slides[currentSlide].icon}
                </div>
                <span className="text-sm font-medium uppercase tracking-wider font-heading text-yellow-300">
                  {slides[currentSlide].subtitle}
                </span>
              </div>

              <h1 className="text-4xl lg:text-7xl font-bold leading-tight font-heading">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-pulse">
                  {slides[currentSlide].title}
                </span>
              </h1>

              <p className="text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto font-body text-gray-200">
                {slides[currentSlide].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl font-heading text-lg"
                >
                  Explore Articles
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl font-heading text-lg backdrop-blur-sm"
                >
                  Join Community
                </Button>
              </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between">
              <Button
                variant="secondary"
                size="icon"
                onClick={prevSlide}
                className="bg-black/30 backdrop-blur-sm hover:bg-yellow-400 hover:text-black transition-all duration-300 hover:scale-110 rounded-full w-12 h-12 border border-white/20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={nextSlide}
                className="bg-black/30 backdrop-blur-sm hover:bg-yellow-400 hover:text-black transition-all duration-300 hover:scale-110 rounded-full w-12 h-12 border border-white/20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-yellow-400 scale-125 shadow-lg"
                    : "bg-white/30 hover:bg-yellow-400/70 hover:scale-110"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
