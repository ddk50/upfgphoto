import { createBrowserRouter } from "react-router-dom"
import App, { RootShell } from "@/App"
import { GuestLayout } from "@/components/layout/GuestLayout"
import { HomePage } from "@/pages/HomePage"
import { FolderPage } from "@/pages/FolderPage"
import { UploadPage } from "@/pages/UploadPage"
import { SearchPage } from "@/pages/SearchPage"
import { MyPhotosPage } from "@/pages/MyPhotosPage"
import { AdminUsersPage } from "@/pages/AdminUsersPage"
import { PendingApprovalPage } from "@/pages/PendingApprovalPage"
import { SharedFoldersPage } from "@/pages/SharedFoldersPage"
import { StatsPage } from "@/pages/StatsPage"
import { TrashPage } from "@/pages/TrashPage"
import { GuestFolderPage } from "@/pages/GuestFolderPage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootShell,
    children: [
      {
        Component: App,
        children: [
          { index: true, Component: HomePage },
          { path: "folders/*", Component: FolderPage },
          { path: "search", Component: SearchPage },
          { path: "upload", Component: UploadPage },
          { path: "my-photos/*", Component: MyPhotosPage },
          { path: "admin/users", Component: AdminUsersPage },
          { path: "pending", Component: PendingApprovalPage },
          { path: "shared-folders", Component: SharedFoldersPage },
          { path: "stats", Component: StatsPage },
          { path: "trash", Component: TrashPage },
        ],
      },
      {
        path: "g",
        Component: GuestLayout,
        children: [
          { path: ":token/*", Component: GuestFolderPage },
        ],
      },
    ],
  },
])
