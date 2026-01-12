'use client'

import { useState, useEffect } from 'react'

interface TourStep {
  id: string
  title: string
  description: string
  icon: string
  position: { top?: string; bottom?: string; left?: string; right?: string }
  highlight?: string
}

interface AppTourProps {
  isOpen: boolean
  onClose: () => void
  userRole?: 'parent' | 'child'
}

export function AppTour({ isOpen, onClose, userRole = 'child' }: AppTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const childSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Scribble!',
      description: "Hey there! Let's take a quick tour of your awesome new chat app. It's super easy and fun!",
      icon: 'wave',
      position: { top: '50%', left: '50%' }
    },
    {
      id: 'contacts',
      title: 'Your Friends List',
      description: "This is where all your friends appear! Click on a friend's name to start chatting with them.",
      icon: 'users',
      position: { top: '20%', left: '10%' },
      highlight: 'contacts'
    },
    {
      id: 'chat',
      title: 'Chat Area',
      description: "Here's where the magic happens! All your messages with friends show up here in colorful bubbles!",
      icon: 'chat',
      position: { top: '30%', left: '50%' },
      highlight: 'chat'
    },
    {
      id: 'input',
      title: 'Send Messages',
      description: 'Type your message here and hit send! You can also send fun GIFs by clicking the GIF button!',
      icon: 'pencil',
      position: { bottom: '15%', left: '50%' },
      highlight: 'input'
    },
    {
      id: 'invite',
      title: 'Add Friends',
      description: "Want to chat with someone new? Click 'Invite' at the top to share your code or add a friend's code!",
      icon: 'userplus',
      position: { top: '8%', right: '20%' },
      highlight: 'invite'
    },
    {
      id: 'settings',
      title: 'Your Settings',
      description: 'Customize your profile, change your theme, and make Scribble yours!',
      icon: 'settings',
      position: { top: '8%', right: '10%' },
      highlight: 'settings'
    },
    {
      id: 'done',
      title: "You're All Set!",
      description: "That's it! You're ready to start chatting. Have fun and be kind to your friends!",
      icon: 'check',
      position: { top: '50%', left: '50%' }
    }
  ]

  const parentSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Scribble',
      description: "Let's show you around! Scribble helps your family stay connected safely.",
      icon: 'wave',
      position: { top: '50%', left: '50%' }
    },
    {
      id: 'contacts',
      title: 'Contacts & Conversations',
      description: 'See all your connections here. Click on a contact to view your chat with them.',
      icon: 'users',
      position: { top: '20%', left: '10%' },
      highlight: 'contacts'
    },
    {
      id: 'parent-controls',
      title: 'Parent Dashboard',
      description: 'Access parental controls to monitor your children\'s activity and manage their chat permissions.',
      icon: 'shield',
      position: { top: '8%', right: '25%' },
      highlight: 'parent'
    },
    {
      id: 'invite',
      title: 'Connect With Family',
      description: "Share your invite code with family members so they can add you. You can also add others using their codes!",
      icon: 'userplus',
      position: { top: '8%', right: '20%' },
      highlight: 'invite'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize your profile and app preferences here.',
      icon: 'settings',
      position: { top: '8%', right: '10%' },
      highlight: 'settings'
    },
    {
      id: 'done',
      title: "You're Ready!",
      description: "You're all set! Enjoy staying connected with your family safely.",
      icon: 'check',
      position: { top: '50%', left: '50%' }
    }
  ]

  const steps = userRole === 'parent' ? parentSteps : childSteps

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const step = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const isCentered = step.position.top === '50%' && step.position.left === '50%'

  // Icon component
  const renderIcon = (iconName: string) => {
    const icons = {
      wave: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      ),
      users: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      chat: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      pencil: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      userplus: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      settings: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      shield: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      check: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return icons[iconName as keyof typeof icons] || icons.check
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          top: step.position.top,
          bottom: step.position.bottom,
          left: step.position.left,
          right: step.position.right,
          transform: isCentered ? 'translate(-50%, -50%)' : 'none'
        }}
      >
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-1 rounded-2xl shadow-2xl max-w-md animate-in">
          <div className="bg-background rounded-2xl p-6 space-y-4">
            {/* Icon Header */}
            <div className="flex items-center justify-center">
              <div className="text-primary animate-pulse">
                {renderIcon(step.icon)}
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                      : index < currentStep
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip Tour
              </button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
