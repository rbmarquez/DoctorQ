"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const SIDEBAR_COOKIE_NAME = "sidebar"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const SidebarContext = React.createContext<{
  open: boolean
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void
  variant: "default" | "collapsible" | "icon"
  collapsible: boolean
  collapsed: boolean
  setCollapsed: (value: boolean | ((value: boolean) => boolean)) => void
}>({
  open: true,
  setOpen: () => {},
  variant: "default",
  collapsible: false,
  collapsed: false,
  setCollapsed: () => {},
})

const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "collapsible" | "icon"
  collapsible?: boolean
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const SidebarProvider = ({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  variant = "default",
  collapsible = false,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange: setCollapsedProp,
}: SidebarProviderProps) => {
  const [open, _setOpen] = React.useState(defaultOpen)
  const [collapsed, _setCollapsed] = React.useState(defaultCollapsed)

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const setCollapsed = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const collapsedState = typeof value === "function" ? value(collapsed) : value
      if (setCollapsedProp) {
        setCollapsedProp(collapsedState)
      } else {
        _setCollapsed(collapsedState)
      }
    },
    [setCollapsedProp, collapsed]
  )

  const value = React.useMemo(
    () => ({
      open: openProp ?? open,
      setOpen,
      variant,
      collapsible,
      collapsed: collapsedProp ?? collapsed,
      setCollapsed,
    }),
    [
      openProp,
      open,
      setOpen,
      variant,
      collapsible,
      collapsedProp,
      collapsed,
      setCollapsed,
    ]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div className="text-sidebar-foreground">{children}</div>
    </SidebarContext.Provider>
  )
}

const sidebarVariants = cva(
  "group/sidebar relative flex h-full w-full flex-col gap-4 bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "border-r border-sidebar-border",
        collapsible: "border-r border-sidebar-border",
        icon: "border-r border-sidebar-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface SidebarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sidebarVariants> {
  collapsible?: boolean
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, variant, collapsible = false, children, ...props }, ref) => {
    const { collapsed } = useSidebar()

    return (
      <aside
        ref={ref}
        className={cn(
          sidebarVariants({ variant }),
          "w-[var(--sidebar-width)]",
          collapsible && "data-[collapsed=true]:w-[var(--sidebar-collapsed-width)]",
          className
        )}
        data-collapsed={collapsed}
        {...props}
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-[60px] items-center px-2",
        collapsed && "h-[60px] justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-1 flex-col gap-2 overflow-hidden",
        collapsed && "items-center",
        className
      )}
      {...props}
    >
      <div className="flex-1 overflow-auto">
        <div
          className={cn(
            "flex flex-col gap-2 p-2",
            collapsed && "items-center"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 p-4",
        collapsed && "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-4",
        collapsed && "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "px-2 text-xs font-semibold tracking-wider text-sidebar-foreground/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        collapsed && "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        collapsed && "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        collapsed && "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, asChild = false, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  const Comp = asChild ? React.Fragment : "button"

  return (
    <Comp>
      <button
        ref={ref}
        className={cn(
          "group/menu-button relative flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
          collapsed && "justify-center px-2",
          className
        )}
        data-active={false}
        {...props}
      >
        {children}
      </button>
    </Comp>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return null
  }

  return (
    <button
      ref={ref}
      className={cn(
        "ml-auto opacity-0 transition-opacity group-hover/menu-button:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"

  return (
    <Comp>
      <button
        ref={ref}
        className={cn(
          "group/menu-button relative flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
          className
        )}
        data-active={false}
        {...props}
      >
        {children}
      </button>
    </Comp>
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        collapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {showIcon && <Skeleton className="h-4 w-4" />}
      {!collapsed && <Skeleton className="h-4 flex-1" />}
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) {
    return null
  }

  return (
    <Separator
      ref={ref}
      className={cn("bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children || (open ? <PanelLeftClose /> : <PanelLeftOpen />)}
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-6 flex-col items-center border-r border-sidebar-border bg-sidebar",
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>
      {children}
    </div>
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} 
