import { Link } from "react-router-dom"
import type { FolderNode } from "@/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type FolderBreadcrumbProps = {
  trail: FolderNode[]
}

export function FolderBreadcrumb({ trail }: FolderBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((node, i) => {
          const isLast = i === trail.length - 1
          const label = i === 0 ? "ホーム" : node.name
          const to = i === 0 ? "/" : `/folders${node.path}`
          return (
            <span key={node.path} className="contents">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
