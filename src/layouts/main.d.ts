import type { PageProps } from "gatsby"
import type { ReactNode } from "react"

declare const Layout: (props: {
  location: PageProps["location"]
  bodyClass?: string
  children?: ReactNode
}) => JSX.Element

export default Layout
