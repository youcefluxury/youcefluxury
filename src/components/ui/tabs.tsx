"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * Tab row that slides instead of showing a scrollbar.
 *
 * A right arrow (▶) is shown while there are still tabs hidden past the edge
 * and it brings them into view. Once the row has been scrolled, the left arrow
 * (◀) appears so you can go back — and it disappears again at the beginning.
 * Both the visibility and the sliding are measured from the real element
 * positions, so nothing is mirrored in RTL or in LTR.
 */
function TabsList({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({
    overflow: false,
    atStart: true,
    atEnd: true,
  })

  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => {
      const first = track.firstElementChild as HTMLElement | null
      const last = track.lastElementChild as HTMLElement | null
      const hidden = track.scrollWidth - track.clientWidth > 4
      if (!hidden || !first || !last) {
        setEdges({ overflow: false, atStart: true, atEnd: true })
        return
      }
      const rtl = document.documentElement.dir === "rtl"
      const box = track.getBoundingClientRect()
      const firstBox = first.getBoundingClientRect()
      const lastBox = last.getBoundingClientRect()
      setEdges({
        overflow: true,
        // In RTL the first tab sits on the right, in LTR on the left.
        atStart: rtl
          ? firstBox.right <= box.right + 1
          : firstBox.left >= box.left - 1,
        atEnd: rtl
          ? lastBox.left >= box.left - 1
          : lastBox.right <= box.right + 1,
      })
    }

    measure()
    track.addEventListener("scroll", measure, { passive: true })
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure)
      return () => {
        track.removeEventListener("scroll", measure)
        window.removeEventListener("resize", measure)
      }
    }
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => {
      track.removeEventListener("scroll", measure)
      observer.disconnect()
    }
  }, [])

  /** 1 = reveal the tabs hidden past the far edge, -1 = go back to the start. */
  function slide(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const rtl = document.documentElement.dir === "rtl"
    const box = track.getBoundingClientRect()
    const tabs = Array.from(track.children) as HTMLElement[]
    const isPastEdge = (tab: HTMLElement) =>
      rtl
        ? tab.getBoundingClientRect().left < box.left - 1
        : tab.getBoundingClientRect().right > box.right + 1
    const target =
      direction === 1
        ? tabs.find(isPastEdge)
        : [...tabs].reverse().find((tab) => {
            const tabBox = tab.getBoundingClientRect()
            return rtl ? tabBox.right > box.right + 1 : tabBox.left < box.left - 1
          })
    // scrollIntoView lets the browser decide the direction — no mirrored math.
    target?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    })
  }

  const arrow =
    "bg-card text-foreground absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border/70 shadow-sm transition-colors hover:bg-muted"

  return (
    <div className="relative w-full min-w-0">
      <TabsPrimitive.List
        ref={trackRef}
        data-slot="tabs-list"
        className={cn(
          "bg-muted text-muted-foreground scrollbar-none inline-flex h-9 w-fit items-center justify-center overflow-x-auto rounded-lg p-[3px]",
          className
        )}
        style={{ ...style, scrollbarWidth: "none", msOverflowStyle: "none" }}
        {...props}
      >
        {children}
      </TabsPrimitive.List>

      {edges.overflow && !edges.atEnd ? (
        <button
          type="button"
          aria-label="show the next tabs"
          onClick={() => slide(1)}
          className={cn(arrow, "right-0")}
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}

      {edges.overflow && !edges.atStart ? (
        <button
          type="button"
          aria-label="show the previous tabs"
          onClick={() => slide(-1)}
          className={cn(arrow, "left-0")}
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
