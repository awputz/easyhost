'use client'

import { useState } from 'react'
import {
  MessageSquare,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Star,
  Loader2,
  Check,
} from 'lucide-react'
import type { FeedbackConfig, FeedbackType } from './feedback-settings'

interface FeedbackWidgetProps {
  documentId: string
  documentSlug: string
  config: FeedbackConfig
}

interface FeedbackData {
  type: 'comment' | 'reaction' | 'rating'
  content?: string
  reaction?: string
  rating?: number
  email?: string
  name?: string
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👀', label: 'Interesting' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '👎', label: 'Dislike' },
]

export function FeedbackWidget({
  documentId,
  documentSlug,
  config,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)

  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-left': 'left-4',
    'bottom-center': 'left-1/2 -translate-x-1/2',
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const feedbackData: FeedbackData = {
        type: config.feedbackType === 'rating' ? 'rating'
            : config.feedbackType === 'reactions' ? 'reaction'
            : 'comment',
      }

      if (config.feedbackType === 'comments' || config.feedbackType === 'all') {
        feedbackData.content = comment
      }
      if (config.feedbackType === 'reactions' || config.feedbackType === 'all') {
        feedbackData.reaction = selectedReaction || undefined
      }
      if (config.feedbackType === 'rating' || config.feedbackType === 'all') {
        feedbackData.rating = rating
      }
      if (config.requireEmail || email) {
        feedbackData.email = email
      }
      if (name) {
        feedbackData.name = name
      }

      const response = await fetch(`/api/pagelink/documents/${documentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setIsSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitted(false)
        setComment('')
        setEmail('')
        setName('')
        setRating(0)
        setSelectedReaction(null)
      }, 2000)
    } catch (error) {
      console.error('Feedback error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = () => {
    if (config.requireEmail && !email) return false

    switch (config.feedbackType) {
      case 'comments':
        return comment.trim().length > 0
      case 'reactions':
        return selectedReaction !== null
      case 'rating':
        return rating > 0
      case 'all':
        return comment.trim().length > 0 || selectedReaction !== null || rating > 0
      default:
        return false
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 ${positionClasses[config.position]} z-50 flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-full shadow-lg transition-all hover:scale-105`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-medium">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {config.thankYouMessage}
                </h3>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Share Your Feedback
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Rating */}
                  {(config.feedbackType === 'rating' || config.feedbackType === 'all') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How would you rate this document?
                      </label>
                      <div className="flex gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= (hoveredStar || rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  {(config.feedbackType === 'reactions' || config.feedbackType === 'all') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick reaction
                      </label>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {REACTIONS.map(({ emoji, label }) => (
                          <button
                            key={emoji}
                            onClick={() => setSelectedReaction(selectedReaction === emoji ? null : emoji)}
                            className={`text-2xl p-2 rounded-lg transition-all ${
                              selectedReaction === emoji
                                ? 'bg-amber-100 scale-110'
                                : 'hover:bg-gray-100'
                            }`}
                            title={label}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {(config.feedbackType === 'comments' || config.feedbackType === 'all') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your feedback
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={config.placeholder}
                        rows={4}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Email & Name (if required) */}
                  {(config.requireEmail || !config.allowAnonymous) && (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit()}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
