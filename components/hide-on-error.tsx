"use client"

import { Component, type ReactNode } from "react"

interface HideOnErrorProps {
  children: ReactNode
  onError?: () => void
}

/** Renders its children, or nothing once they fail to render (a lazy chunk that didn't load, say), so the error stays out of the page's error screen. */
export class HideOnError extends Component<HideOnErrorProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
