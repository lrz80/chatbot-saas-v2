"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Variantes de estilo para el trigger (las pestañas)
const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-white/5 text-white hover:bg-white/10 data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Raíz del componente de tabs (el contenedor general)
const Tabs = TabsPrimitive.Root;

// Lista de pestañas
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex w-full sm:w-auto justify-start sm:justify-center overflow-x-auto rounded-lg bg-white/10 p-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// Pestaña individual
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants(), className)}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

// Contenido de cada pestaña
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

// Exporta los componentes
export { Tabs, TabsList, TabsTrigger, TabsContent };
