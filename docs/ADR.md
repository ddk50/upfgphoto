# Architecture Decision Records — uprun_front_mock

upfgphoto（写真共有サービス, jQuery + Rails 4, 2013年頃）のフロントエンドリプレイスに向けた UI モックで下してきた設計判断の記録。モックは方向性検証が目的だが、ここでの決定の多くは本実装にそのまま持ち込む前提。

- 形式: 1判断 = 1 ADR。Status / Context / Decision / Consequences
- 日付は判断時期の目安（Phase 1–6: 2026年6月上旬、ADR-015以降: 記載日）

---

## ADR-001: モックファースト開発（API 非接続・静的データ）

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 1)

**Context:** 既存システムの UI/UX がレガシーで、本実装前に方向性を確認したい。いきなり本実装すると手戻りが大きい。

**Decision:** バックエンド API には接続せず、ハードコードされたモックデータ（`src/mocks/`）で UI/UX を検証する。状態管理・データ取得ライブラリは導入せず、React Context + `useState` のみで賄う。データ変更（削除・アップロード等）はメモリ上のみで、リロードで初期状態に戻る（モック的 Undo として機能）。

**Consequences:** 仕様議論が UI を触りながらできる。実 API 接続は別タスクとして扱う。Rails バックエンドは将来 API サーバとしてそのまま再利用予定。

## ADR-002: 技術スタック — Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 1)

**Context:** jQuery + Rails 4 (2013) からのフロントエンド刷新。新規フロントエンドは TypeScript 必須（ユーザ方針）。

**Decision:** Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + React Router v7。デザインは Apple Photos / Unsplash 寄り（余白多め・上品・写真主役・ライトモード基調）。

**Consequences:** shadcn/ui によりコンポーネントはコピー所有型で自由に改変可能。本実装でも同スタックを踏襲する想定。

## ADR-003: 仮想フォルダ = path 文字列、UI 側でツリー化

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 1)

**Context:** 写真をフォルダ階層で見せたいが、バックエンドに実フォルダエンティティを持たせるかは未確定。

**Decision:** 写真ごとに `Photo.path`（`/2024/旅行/京都/桜.jpg` 形式、末尾はファイル名）を持たせ、UI 側でパースしてツリー化する（`src/lib/tree.ts:buildTree`）。フォルダは写真の path から導出される**仮想的な存在**で、独立したエンティティを持たない。

**Consequences:** 写真が1枚もない空フォルダは表現できない（→ ADR-014 のフォルダ作成 UX に影響）。フォルダのリネーム・移動は全配下写真の path 書き換えになる。シンプルさと引き換えのトレードオフとして受容。

## ADR-004: タグ概念を一般 UI から隠し、横断検索バーで吸収

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 2)

**Context:** タグはバックエンドの実装詳細として有用だが、「タグで検索する」という操作モデルをライトユーザに要求したくない。

**Decision:** 「タグ」という用語・専用ナビを一般 UI に出さない。表示する場面（写真詳細・検索チップ）では「キーワード」と呼ぶ。検索は1本のバーで path / title / filename / tag を横断マッチ（`src/lib/search.ts:searchPhotos`）。タグ付けはパワーユーザ向け（アップロードの「詳細設定 (任意)」Collapsible 内、デフォルト閉）。

**Consequences:** Google Photos / Apple Photos 的な「1本のバーに打つだけ」の検索 UX。タグの CRUD 管理画面は作らない。

## ADR-005: アクセス制御はフォルダ単位 + 親→子継承

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 3)

**Context:** バックエンド DB 的には写真1枚ごとに制御可能だが、UX としてその粒度は細かすぎる。

**Decision:** アクセス制御は**仮想フォルダ（パス）単位**。`AccessRule = { mode: "inherit" | "everyone" | "restricted" (| "guest") , allowedUserIds? }` を `AccessRuleMap`（`Record<folderPath, AccessRule>`）で保持し、`src/lib/access.ts:resolveAccess` が親方向に遡って最初の非 inherit ルールを実効ルールとして返す。ルート `/` のデフォルトは `everyone`。子フォルダは明示的な上書きが可能。メンバー識別は Twitter ID（モックではユーザ ID）→ 後に Gmail へ変更（ADR-011）。

**Consequences:** Google Drive / Notion 型の直感的な運用。「親を見れば配下も分かる」一方、子の独立ルールとの衝突ケースが生まれる（→ ADR-013 の上書き警告で解決）。

## ADR-006: 3ロールモデル（admin / user / guest）

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 3)

**Context:** 要件は「特定ユーザの Ban・追加（管理者）」「自分のフォルダだけ公開設定変更可（通常）」「限定リンクでログイン不要アクセス（ゲスト）」。

**Decision:** ロールは `admin / user / guest` の3種のみ。
- **admin**: 全フォルダの公開設定を上書き可。他人のフォルダ編集時は UI が赤系警告（Dialog バナー・保存ボタン `bg-red-600`）で「管理者権限の行使」を自覚させる。`/admin/users` でユーザ管理
- **user**: 自分所有フォルダのみ編集可（`isOwner(path)`）。非オーナーには「公開設定」ボタン disabled + Tooltip
- **guest**: 限定リンク経由のみ（ADR-008）
- モックでは Context の `viewAsRole` をヘッダの `UserMenu` で切替えて全ロールの UI を検証

**Consequences:** ロールを増やさずに済む設計原則が生まれ、後の「パワーユーザ」要求も UI ヒンティングで吸収（ADR-012）。

## ADR-007: フォルダオーナーシップと「自分が乗ってる枝を切れない」原則

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 4)

**Context:** 公開設定の編集権限は「誰のフォルダか」に依存する。また、設定操作で自分自身をロックアウトする事故を防ぎたい。

**Decision:** `FolderOwnerMap`（path → userId, `src/mocks/owners.ts`）でフォルダ所有者を管理し、`isOwner(path)` / `canEditAccess(path)` で判定。**オーナーは自分を `allowedUserIds` から外せない**（UserPicker で self は disabled）。inherit 選択時に親が restricted で自分が含まれない場合は保存をブロックして警告。

**Consequences:** セルフロックアウト事故を UI レベルで防止。本実装ではサーバ側バリデーションとしても必須。

---

### 共有まわりの決定（ADR-008〜010, 013〜014）

## ADR-008: 限定リンク共有 — `guest` モード + 22文字 base62 トークン

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 4)

**Context:** ログインしていない相手（家族・イベント参加者等）に特定フォルダだけ見せたい。アカウント発行を強要しない共有手段が必要。

**Decision:**
- `AccessRule.mode = "guest"` をフォルダに設定すると共有リンクが発行される。トークンは **22文字の base62**（`src/lib/token.ts:generateShareToken`）で、URL は `/g/<token>`
- トークンは総当たりが実質不可能な長さ（62^22）を担保。「URL を知っている人だけが見られる」モデル
- ゲスト用画面は `GuestLayout` が自動適用され、検索・ナビ・UserMenu をヘッダから排除した最小 UI（青系アクセント）。検索ページはゲストなら `/` へリダイレクト
- ルーティングは `router.tsx` の `RootShell` 配下に通常 App と GuestLayout の2系統を並列配置
- ログインユーザ向け `/folders/<path>` とゲスト向け `/g/<token>/...` が同じ実体を指す**エイリアス**になるが、canonical URL 設計として意図的に許容

**Consequences:** ログイン不要の共有が実現。トークンがそのまま認可情報なので、本実装では失効・再発行（トークンローテーション）を設計に含めること。

## ADR-009: 共有リンクのサブパスナビゲーション — トークンはルートのみを指す

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 6)

**Context:** 共有フォルダにサブフォルダがある場合、初期実装ではゲストに「タイトルだけ表示・リンク無効」で先に進ませなかった。共有体験として不完全。

**Decision:**
- URL 形式は `/g/<token>/<sub...>`。**トークンは共有ルートフォルダのみ**を指し、サブパスは相対パスとして `Context.resolveGuestPath(token, splat)` で解決する（サブフォルダごとに別トークンを発行しない）
- ゲストはサブフォルダをクリックして掘り下げられるが、**共有ルートの外には絶対に出られない**。パンくずの最上段は `/g/<token>`（共有ルート）で止まる
- ゲストアップロードは `?upload=1` クエリでモーダル起動（`/g/<token>/upload` のようなパス形式だと「upload という名前のサブフォルダ」と曖昧になるため、クエリで回避）

**Consequences:** 1つのリンクで配下全体を共有でき、リンク管理が単純。「サブフォルダも共有される」ことが利用者に見えにくい問題は ADR-013 の inline 警告で補完。

## ADR-010: ゲストアップロードと `guest_anonymous` 疑似ユーザ

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 5)

**Context:** イベント共有では「ゲストに写真を上げてもらう」ユースケースが重要。だがゲストはユーザレコードを持たない。

**Decision:** ゲスト経由のアップロードは `Photo.uploaderId = GUEST_UPLOADER_ID ("guest_anonymous")` というユーザリスト外の疑似 ID を割り当てる。グリッドでは Link2 アイコン入りの青バッジ、写真詳細では「ゲスト（外部）」表示。

**Consequences:** ゲスト写真の出所が UI 上で追跡でき、管理者による整理・削除の対象として扱える。本実装では「どのトークン経由か」まで記録すると監査性が上がる。

## ADR-011: 認証は Gmail、新規ユーザは admin 承認制

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 6) — Twitter ID 識別（ADR-005 当初）を置換

**Context:** 当初メンバー識別に Twitter ID を想定したが、外部サービス依存とハンドル変更リスクがある。また誰でも登録できると身内向けサービスとして困る。

**Decision:** 認証は Gmail (OAuth) を想定し `User.email` を正とする（`@handle` は廃止、表示は `name` 中心・ピッカーや管理画面で補助的に email）。新規登録ユーザは `User.status = "pending"` で開始し、admin が `/admin/users` の「承認待ち」タブで承認/却下。承認まで `/pending` 待機ページに固定。`ViewAsRole = UserRole | "pending"` でモック上も検証可能。

**Consequences:** クローズドな身内サービスとしての入口管理が成立。招待フロー（メール送信等）は本実装の課題。

## ADR-012: パワーユーザ機能は新ロールを作らず「UI ヒンティング」で提供

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 6)

**Context:** フォルダ手動指定・タグ付けなどを使いこなす層と、何も考えずアップロードしたい層が混在する。「パワーユーザロール」を追加する案もあった。

**Decision:** ロールは増やさない（ADR-006 維持）。フォルダ作成・タグ入力・アップロード先指定は**デフォルト非表示 + 「詳細設定 (任意)」Collapsible** に格納。ライトユーザは何も開かずにアップロードでき、パワーユーザだけが開いて使う。

**Consequences:** 権限モデルが単純なまま二層の UX を実現。機能の発見性は下がるが、意図的なトレードオフ。

## ADR-013: 継承と独立ルールの衝突は「自動上書きしない」— 3択の明示的警告

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 6)

**Context:** 親フォルダの公開設定を変えるとき、子孫に独立ルールがあると「親を変えたのに子が変わらない」or「子の設定が黙って消える」のどちらかになりがち。どちらもサイレントだと事故る。

**Decision:**
- 親の再設定時、`lib/access.ts:findDescendantRules` で子孫の独立ルールをスキャンし、あれば `OverrideWarningDialog` で **3択**を提示: 「上書き（`clearDescendantRules` で子孫ルールを削除）/ 維持（子孫ルールを残す）/ キャンセル」。**自動上書きは絶対にしない**
- フォルダを guest 化する際は、`AccessSettingsDialog` 内に「サブフォルダ N 件も共有される」の amber inline 警告を表示（ブロックはしない、情報提供のみ）

**Consequences:** 共有範囲が意図せず広がる/狭まる事故を、操作時点の明示的な選択に変換。本実装でもこの3択 UX を踏襲する。

## ADR-014: 空フォルダは作れない — フォルダ作成はアップロードで実体化

**Status:** 承認済み ｜ **Date:** 2026-06 (Phase 6)

**Context:** ADR-003 の帰結として、写真ゼロのフォルダはツリーに存在できない。それでも「先にフォルダを作りたい」という操作メンタルモデルはある。

**Decision:** フォルダ作成という独立した操作は持たず、**「フォルダを作る」＝「そこに最初の写真を入れる行為」に統一**する。`CreateFolderButton` はフォルダ名入力後、`/upload?to=<フルパス>` に遷移してアップロード画面の保存先をプリセットする（手動指定モード ON・詳細設定を開いた状態・保存先を示す info バナー付き。`?to=` があるとき自動振り分けは適用しない）。写真を選ばず離脱すればフォルダは生まれない。あわせてアップロードのデフォルトは **EXIF 撮影日（モックでは `lastModified` で代替）から `/yyyy/mm/dd` を自動生成**して振り分け（`src/lib/upload.ts:groupByAutoFolder`、複数日は複数フォルダへ）、詳細設定で手動指定を選ぶと単一フォルダに入れる。

（経緯: Phase 6 当初は Toast で「次のアップロードで反映」と案内するだけのデモで、パスはどこにも保存されなかった。2026-07-16 にプリセット遷移方式へ変更し、演出上の嘘を解消）

作成ボタンは**全階層で表示**する（HomePage のトップ `/`、直接写真を持たない中間フォルダ、空フォルダを含む。2026-07-17）。フォルダは仮想パスなので階層による構造的制約はなく、表示条件を設ける理由がない。

**Consequences:** 「フォルダを作ってから入れる」ではなく「入れたら整理されている」が基本動線になる。空フォルダの作り置き（イベント前に器だけ用意等）はできないが、これは受容済みのトレードオフ。本実装でも folders テーブルや placeholder オブジェクトが不要になる。

---

## ADR-015: フォルダタイルは「写真の束（スタック）」表現で写真と差別化

**Status:** 承認済み ｜ **Date:** 2026-07-16

**Context:** フォルダカードと写真タイルがどちらも「正方形のサムネイル」で、パッと見で区別できなかった。

**Decision:** Apple Photos / Google Photos のアルバム風に、フォルダはカバー写真の背後に2枚の「束」レイヤーが覗くスタック表現にする（`src/components/folder/FolderCoverStack.tsx`、FolderCard とゲストページで共用）。写真タイルは縁なし正方形のまま変更しない。検討した代替案: カード化＋フォルダ行 / アイコンバッジ / フォルダ型シルエット。

**Consequences:** セクション見出しに頼らずタイル単体で「入れ物」だと分かる。空フォルダでも束＋アイコンで成立。

## ADR-016: 検索結果にフォルダを表示し、写真は「直接マッチ」のみに絞る

**Status:** 承認済み ｜ **Date:** 2026-07-16 — ADR-004 の検索マッチ仕様を一部変更

**Context:** 従来の検索は写真の path 全体を部分一致で見ていたため、「2023」と検索すると `/2023` 配下の全写真がフラットに並ぶ一方、「2023 というフォルダがある」ことは結果から読めなかった。フォルダセクションを単純に追加すると、フォルダとその中身全部が二重に並ぶ。

**Decision:**
- 検索結果を FolderPage と同じ「フォルダ」「写真」の2セクション構成にする。フォルダ名がクエリに部分一致するフォルダを `src/lib/search.ts:searchFolders` でカード表示（クリックで `/folders/...` へ）
- 写真側のマッチ条件から**ディレクトリ部分の path 一致を廃止**し、タイトル / タグ / **ファイル名**（path 末尾セグメント）のみとする。フォルダ配下というだけの写真はフォルダカードに代表させる
- タグチップ（キーワード絞り込み）は従来どおり写真だけに効き、フォルダセクションはフリーテキストのクエリのみに追従

**Consequences:** 「フォルダを探す」と「写真を探す」が1本のバーで両立し、結果の冗長さがなくなる。ファイル名検索（`IMG_0123.jpg` 等）は維持。ADR-004 の「横断マッチ」の精神は保ちつつ、path はフォルダ結果側が担う分担に変わった。

## ADR-017: マイフォトはフォルダ単位のフラット一覧（自分の写真のみで構成）

**Status:** 承認済み ｜ **Date:** 2026-07-16 — ADR-006 のマイフォト全件フラット表示を置換

**Context:** `/my-photos` は自分の全写真を1枚のグリッドで表示していたが、写真が増えるとスケールしない。またフォルダ単位にする場合、フォルダ内の「他人の写真」が表示・削除の対象に混入してはならない。

**Decision:**
- インデックス（`/my-photos`）は**自分の写真を直接含むフォルダだけ**をカード（スタック表現＋親パスラベル）で最新順に並べる**フラット一覧**。階層ドリルダウンは採らない（自動振り分けの `/yyyy/mm/dd` 階層だと写真まで2〜3クリックかかるため）
- カードクリックで `/my-photos/<path>` に遷移し、そのフォルダ内の自分の写真だけを表示。選択モード・一括削除・Lightbox はフォルダ詳細側に配置
- **他人の写真は構造的に排除**: 一覧・詳細とも `myPhotos` のみから組み立てる（`lib/tree.ts:groupPhotosByFolder`）。枚数・カバー写真・「すべて選択」・削除対象のすべてが自分の写真に閉じ、他人の写真は表示も削除も不可能
- フォルダ全体（他人の写真込み）を見たい時のために「フォルダを開く」リンクで `/folders/<path>` へ抜けられる

**Consequences:** 写真が大量になってもフォルダ数程度のスキャンで済む。同じフォルダでもマイフォトのカウントと FolderPage の総数は意図的に異なる。全削除したフォルダは一覧から自然に消える。

## ADR-018: 共有URLは発行・停止を台帳記録し、admin は全件を閲覧・停止できる

**Status:** 承認済み ｜ **Date:** 2026-07-17 — ADR-008 の共有リンクに監査層を追加

**Context:** 共有停止は `AccessRule` を消すため、過去に発行された共有URLの記録が一切残らなかった。「いつ誰が何を外部公開していたか」を追えないのは、限定リンク（ADR-008）が実質的な認可情報である以上、管理上のリスク。また admin 視点の一覧で自分の共有と他人の共有が混在して見分けにくかった。

**Decision:**
- **共有台帳 `ShareHistoryEntry`**（token / path / 発行者 / 発行日時 / 停止日時 / 停止者 / 停止理由）を導入。記録は Context の `setAccessRule` / `clearDescendantRules` に**一元化**し、呼び出し元（設定ダイアログ・一覧・バナー）は関知しない
- 停止理由は `manual`（明示的な停止）と `parent-override`（ADR-013 の親設定上書きによる連鎖停止）を区別して記録。トークン再発行は「旧トークンの停止 + 新トークンの発行」として2エントリになる
- `/shared-folders` は admin のみ「共有中 / 履歴」の2タブ。履歴は発行日降順の時系列1本（監査用途のため）で、停止済みは無効バッジ、オーナー以外による停止は「（代理）」表示
- 「共有中」タブは admin の場合「**あなたの共有 / 他のユーザの共有**」の2セクションに分割（自分のリンクの棚卸しと管理者としての監視は目的が異なるため）。user は従来どおり自分の共有のみのフラット表示
- admin は誰の共有でも停止可（既存挙動の追認。Phase 6 実装済み）

**Consequences:** 停止済みリンクも含めた全発行履歴を admin が追跡できる。本実装では `share_links` テーブル（token / folder_path / issued_by / issued_at / revoked_at / revoked_by / revoked_reason）として永続化し、AccessRule から独立させる。モックでは発行者・停止者を表示名で持つが、本実装ではユーザ ID 参照にする。

## ADR-019: オーナー = 最初の実体化者、公開設定は他人の restricted に無条件隷属

**Status:** 承認済み ｜ **Date:** 2026-07-18 — ADR-007 の編集権判定を拡張

**Context:** 複数人が同じフォルダに写真を上げる場合の「オーナーは誰か・公開設定を触れるのは誰か」が未定義だった（モックは静的な `FolderOwnerMap` ＋デフォルトオーナーで、アップロードと無関係）。また子ルール優先の継承モデル（ADR-005）では、他人の restricted フォルダ配下に自分がサブフォルダを実体化し、guest 共有することで親の制限を突破できる穴があった。

**Decision:**

1. **可視性と管理権の分離**: everyone は「誰でも見られる」であって「誰でも設定を触れる」ではない。公開設定の編集権はモードに依らず所有に基づく
2. **オーナー = そのパスを最初に実体化した人**（最初の写真をアップロードした人）。自動振り分けの日付フォルダ（yyyy/mm/dd）も同じルール。アップロードでオーナーは変わらない。guest アップロードで生まれたフォルダは最も近い既存祖先のオーナーに帰属
3. **他人の restricted への無条件隷属**: 祖先（自身含む）に他人所有の restricted ルールが1つでもあるフォルダでは、公開設定を一切変更できない（そのrestrictedのオーナーと admin のみ可）。**間に everyone 等の上書きが挟まっても隷属は解除されない**。自分の restricted のみのゾーン内では従来どおり子で上書き可能。ネストした他人 restricted（A と C）は実質 admin のみ。検討した代替案「緩和方向のみ禁止」は restricted の許可リスト比較まで必要になり複雑なため不採用
4. **既存の子ルールの残置は親オーナーの明示的選択**: B の guest 共有後に A が祖先を restricted 化するケースは ADR-013 の3択が既にカバー（「維持」は A が警告を見た上での選択であり、黙った突破ではない）
5. **restricted 化時のアップローダー保護**（未実装・本実装向け）: フォルダ内に他人の写真がある場合は警告し、アップローダーを allowedUserIds の初期候補として提示する

**実装**: 判定は `lib/access.ts:canEditAccess`（+ `findRestrictedAncestorSources`）の純関数に一元化し、**vitest のテーブルテスト（`lib/access.test.ts`, 17ケース）を実行可能な仕様書とする**。Rails 本実装時はこのテスト表を移植すること。UI は公開設定ボタンの disabled + 「このフォルダは /xxx（オーナー: 花）の限定公開設定に従属しています」の理由表示（`Context.getAccessEditBlocker`）。

**Consequences:** 「招待されること」と「再共有する権利」が分離され、restricted ゾーンからの情報漏洩経路（サブフォルダ guest 共有）が閉じる。B は他人のゾーン内で自分のサブフォルダを狭めることもできなくなるが、シンプルさとの引き換えとして受容。オーナーシップ（帰属）と設定権（ゾーン支配）は別概念になった。admin によるオーナー移譲は将来課題。

## ADR-020: 既存 upfgphoto からのデータ移行マッピング

**Status:** 承認済み（調査完了・スクリプト未着手） ｜ **Date:** 2026-07-19

**Context:** 本実装に向けて既存システム（Rails 7.0.5 / Ruby 3.1.2 / SQLite、`/home/kazushi/repos/upfgphoto`）のスキーマとコードを調査した。主要概念はほぼ写像可能。特筆事項: (1) `boards.caption` はスラッシュ入りが許され、旧UIも `split("/")` でツリー表示していた — ADR-003 のパスモデルは既存データの正統進化。(2) `transactions.uri_hash` は未参照の未完成機能で、レガシーに実働する共有リンクは存在しない — ADR-008 のトークンは純新規。

**Decision（マッピング表）:**

| 旧 | 新 | 備考 |
|---|---|---|
| `boards.caption`（`/`区切り可・unique） | フォルダ path | caption をそのまま path に。`^@...$` の「トップ固定」慣習は廃止 |
| `board2photos`（photo_id unique = 1写真1ボード） | `Photo.path` | `/<caption>/<photoId>.jpg`。ボード非所属写真は `/未分類` へ |
| `photos.id` | **保存必須** | 実体ファイルは `<id>.jpg`、サムネは `thumbnail_<id>.jpg`。id を変える場合はファイルリネームが必要。サムネは遅延生成なので欠損があり得る |
| `photos.employee_id` | `uploaderId` | `photos.guest=true`（ゲストボード経由）は `guest_anonymous` へ ※実際の employee_id の入り方は移行スクリプト時に実データで確認 |
| `photos` の EXIF 列群 / caption / shotdate | `exif` / `title` / `takenAt` | shotdate は自動フォルダ振り分け済みデータの根拠にはしない（既存所属を維持） |
| `employees` + `users`（uid で連結） | 統合して新 `users` | email は Gmail 連携時に取得。旧 provider/uid は移行ログイン用に保持 |
| `employees.rank` 0,1 / 2,3,4 / 5 | `admin` / `user` / 要決定 | rank 2-4 はコード上区別なし。**rank5 (guest) の既存ユーザを user にするか pending にするかは移行時に決める** |
| `whitelists`（status, expires_at） | `User.status` / `expiresAt`（ADR-011） | accepted→approved, pending→pending, declined→削除 or ban |
| `boards.public=true` | `mode: everyone` | |
| `boards.guest=true` | `mode: guest` + **新規トークン発行** | レガシーはトークンなし（guestは全guestボード閲覧可）だったため、移行時に22文字トークンを発行して台帳（ADR-018）に記録 |
| public でも guest でもない board | `mode: restricted` | `allowedUserIds` は `board2employees` から。`transactions` は監査記録として参照のみ |
| `boards.employee_id` | フォルダオーナー（ADR-019） | first-creator 概念は既存に存在していた |
| `tags` / `tag2photos` | そのまま | |
| `photos.censored` / `boards.specialized` / `transactions.uri_hash`・status | **破棄** | いずれも未実装・未参照の死んだ機能 |
| `activities` / `comikets` | 移行対象外 | activities は将来の通知機能で再設計。comikets は別アプリに分離 |

**Consequences:** 移行スクリプトは SQLite 1ファイル（production.sqlite3）を入力に決定的に書ける。検証観点: 件数一致、caption 重複なし（unique 制約あり）、板非所属写真数、employees/users の uid 不整合、サムネ欠損。ファイル実体は id 命名のまま新ストレージ規約に載せ替え可能。レガシー削除フローの仕様上、孤児 .jpg が存在し得るため移行時に突合して報告する。
