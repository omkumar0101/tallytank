import type React from "react"
export const metadata = {
  title: "Hyper Tanks",
  description: "A Hyper Tanks-inspired game",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/webp" href="/fav.webp" />
      </head>
      <body>{children}</body>
    </html>
  )
}


import './globals.css'