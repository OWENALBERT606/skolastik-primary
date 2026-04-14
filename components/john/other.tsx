"use client"

import { useRef, useEffect } from "react"

export default function Other() {
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video1 = video1Ref.current
    const video2 = video2Ref.current

    if (video1 && video2) {
      const handleVideo1End = () => {
        video2.play()
      }

      video1.addEventListener("ended", handleVideo1End)
      return () => video1.removeEventListener("ended", handleVideo1End)
    }
  }, [])

  const handlePlaySequence = () => {
    if (video1Ref.current && video2Ref.current) {
      video2Ref.current.currentTime = 0
      video1Ref.current.currentTime = 0
      video1Ref.current.play()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-900 to-yellow-400 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">Website Under Development</h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Bridging to a brighter future through Intercultural & Intergenerational Harmony
        </p>
      </div>

      {/* Video Component */}
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            ref={video1Ref}
            className="w-full h-auto"
            controls
            preload="metadata"
            poster="/placeholder.svg?height=400&width=800"
          >
            <source src="/john/KB.mkv" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <video
            ref={video2Ref}
            className="w-full h-auto absolute top-0 left-0 opacity-0 transition-opacity duration-500"
            controls
            preload="metadata"
            poster="/placeholder.svg?height=400&width=800"
            onPlay={() => {
              if (video2Ref.current) video2Ref.current.style.opacity = "1"
              if (video1Ref.current) video1Ref.current.style.opacity = "0"
            }}
            onEnded={() => {
              if (video2Ref.current) video2Ref.current.style.opacity = "0"
              if (video1Ref.current) video1Ref.current.style.opacity = "1"
            }}
          >
            <source src="/john/KB.mkv" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handlePlaySequence}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Play Video Sequence
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Coming Soon</span>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-75"></div>
        </div>
      </div>
    </div>
  )
}