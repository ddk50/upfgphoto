# フォルダビューの組み立て (ADR-003: フォルダは photos.folder_path から導出される仮想概念)。
# 可視性 (restricted) を強制した上で、子フォルダの枚数・カバー写真を集計する
class FolderQuery
  Child = Struct.new(:name, :path, :photo_count, :cover_photo, keyword_init: true)

  def initialize(user, resolver: EffectiveAccessResolver.new)
    @user = user
    @resolver = resolver
  end

  attr_reader :resolver

  def folder_visible?(path)
    @resolver.visible_to?(path, @user)
  end

  # path 直下の写真（新しい順・ゴミ箱除外）。
  # with_attached_image がないと photo_json の attached? 判定が写真ごとに 1 クエリになる
  # (実測: 1081枚のフォルダで 1085 クエリ → 10 クエリ)
  def direct_photos(path)
    Photo.kept.includes(:user, :tags).with_attached_image
         .where(folder_path: path).order(taken_at: :desc)
  end

  # path 直下の子フォルダ（名前・可視な配下の枚数・カバー）
  def children(path)
    prefix = path == "/" ? "/" : "#{path}/"
    grouped = Photo.kept.where("folder_path = ? OR folder_path LIKE ?", path, "#{escape_like(prefix)}%")
                   .group(:folder_path).count
                   .reject { |p, _| p == path }

    by_child = grouped.group_by { |descendant_path, _| child_segment(prefix, descendant_path) }

    # 可視な子と配下パスを先に確定させ、カバー候補 (パスごとの最新写真) を一括ロードする。
    # 子ごとに order().first すると子の数だけクエリが走る N+1 になる
    visible_children = by_child.filter_map do |segment, entries|
      child_path = "#{prefix}#{segment}"
      next unless folder_visible?(child_path)

      visible_paths = entries.map(&:first).select { |p| folder_visible?(p) }
      next if visible_paths.empty?

      [ segment, child_path, entries, visible_paths ]
    end
    latest = latest_photo_by_path(visible_children.flat_map { |_, _, _, v| v })

    visible_children.map do |segment, child_path, entries, visible_paths|
      count = entries.sum { |p, c| visible_paths.include?(p) ? c : 0 }
      # サブツリー内最新 = 各パス内最新のうちの最新 (taken_at 同値は id 降順で決定的に)
      cover = visible_paths.filter_map { |p| latest[p] }.max_by { |ph| [ ph.taken_at, ph.id ] }
      Child.new(name: segment, path: child_path, photo_count: count, cover_photo: cover)
    end.sort_by(&:name)
  end

  def breadcrumb(path)
    AccessPolicy.ancestor_chain(path)
  end

  # path 配下 (直下含む・可視のみ) の最新写真をカバーとして返す。
  # exclude_ids を避けて選ぶ (モザイク表示で親と孫のカバーが同じ写真になるのを防ぐ)。
  # 避けきれない (それしか写真がない) 場合は重複を許容する
  def cover_photo_for(path, exclude_ids: [])
    prefix = path == "/" ? "/" : "#{path}/"
    visible_paths = Photo.kept
                         .where("folder_path = ? OR folder_path LIKE ?", path, "#{escape_like(prefix)}%")
                         .distinct.pluck(:folder_path)
                         .select { |p| folder_visible?(p) }
    scope = Photo.kept.where(folder_path: visible_paths).order(taken_at: :desc)
    scope.where.not(id: exclude_ids).first || scope.first
  end

  private

  # 各 folder_path の最新写真を窓関数で一括取得 (my_photos と同じパターン)。
  # カバー表示は attached? を呼ぶため with_attached_image で添付も preload する
  def latest_photo_by_path(paths)
    return {} if paths.empty?

    ranked = Photo.kept.where(folder_path: paths).select(
      "id, ROW_NUMBER() OVER (PARTITION BY folder_path " \
      "ORDER BY taken_at DESC, id DESC) AS rn"
    )
    ids = Photo.from(ranked, :ranked).where("ranked.rn = 1").pluck(:id)
    Photo.with_attached_image.where(id: ids).index_by(&:folder_path)
  end

  def child_segment(prefix, descendant_path)
    descendant_path.delete_prefix(prefix).split("/").first
  end

  def escape_like(str)
    str.gsub(/[\\%_]/) { |c| "\\#{c}" }
  end
end
