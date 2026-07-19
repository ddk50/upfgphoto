# API 対応表 — PhotoLibraryContext → /api/v1

モック（frontend）の `PhotoLibraryContext` が事実上の仕様書。各関数を API に写像する。
認証はセッション Cookie。`viewAsRole` はモック専用概念で、実ロールはセッションから決まる。

## 認証・ユーザ（Phase 4 実装済み）

| Context | API | 備考 |
|---|---|---|
| ログイン | `POST /auth/google_oauth2` → callback | Google OAuth のみ |
| ログアウト | `DELETE /logout` | |
| currentUser / effectiveRole | `GET /api/v1/me` | 未ログインは `{status: "anonymous"}` |
| pendingUsers / approveUser / rejectUser | `GET/POST/DELETE /api/v1/admin/pending_users...` | + `link`（Twitter-only ユーザへの紐付け） |

## ライブラリ閲覧

| Context | API | 備考 |
|---|---|---|
| tree / findNode / getBreadcrumb | `GET /api/v1/folders?path=/2023` | 子フォルダ（枚数・カバー・access・owner）+ 直下写真 + パンくず + `can_edit_access` / `edit_blocker` を一括返却 |
| photos（全件） | 提供しない | 26k件をSPAに送らない。フォルダ単位・検索単位で取得 |
| getPhotoById | `GET /api/v1/photos/:id` | メタパネル用詳細 |
| 画像URL | photo JSON 内 `urls.{small,large,original}` | ActiveStorage proxy パス。未添付なら null |
| searchPhotos / searchFolders | `GET /api/v1/search?q=&tags=&owned=me` | ADR-016: フォルダ + 直接マッチ写真の2セクション |
| summarizeTags | `GET /api/v1/tags` | name + count |
| myPhotos / groupPhotosByFolder | `GET /api/v1/my_photos` / `?path=` | ADR-017: フォルダ単位のフラット一覧 |
| storage | `GET /api/v1/storage` | Blob 合計 + クォータ |
| users（UserPicker用） | `GET /api/v1/users` | approved のみの最小情報 |

## 写真の操作

| Context | API | 備考 |
|---|---|---|
| addPhotos（アップロード） | `POST /api/v1/photos` (multipart `files[]`, `folder_path?`, `tags?`) | folder_path 省略時は EXIF 撮影日から `/yyyy/mm/dd` 自動振り分け (ADR-014)。新規パスは first-creator 記録 (ADR-019) |
| deletePhoto / canDeletePhoto | `DELETE /api/v1/photos/:id` | 自分の写真 or admin (403) |

## アクセス制御・共有

| Context | API | 備考 |
|---|---|---|
| resolveAccess / getOwnRule / findDescendantRules | `GET /api/v1/access_rules?path=` | 実効ルール + 自ルール + 子孫の独立ルール（上書き警告用, ADR-013） |
| setAccessRule / clearDescendantRules | `PUT /api/v1/access_rules` (`path, mode, member_ids?, clear_descendants?`) | mode=inherit でルール削除。guest 遷移で台帳に発行/停止を自動記録 (ADR-018)。`AccessPolicy.can_edit_access?` で隷属ガード (ADR-019) |
| shareHistory / 共有中一覧 | `GET /api/v1/share_links` | admin: 全件+履歴 / user: 自分がオーナーの分 |
| 共有停止 | `PUT /api/v1/access_rules` (mode=inherit) | 台帳に revoke 記録 |

## ゲスト（認証不要）

| Context | API | 備考 |
|---|---|---|
| resolveGuestPath / tokenToFolderPath | `GET /api/v1/g/:token?sub=a/b` | 共有ルート外へは出られない (ADR-009)。無効トークンは 404 |
| ゲストアップロード | `POST /api/v1/g/:token/photos` | uploader はシステムユーザ guest_anonymous (ADR-010) |

## 可視性の原則（モックとの差分）

モックはログインユーザに全フォルダを見せていた（バッジ表示のみ）が、**実 API は restricted を強制する**：
実効ルールが restricted のフォルダ・写真は members + admin にのみ返す。everyone / guest は approved 全員に可視。
