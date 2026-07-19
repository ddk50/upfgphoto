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

  # path 直下の写真（新しい順）
  def direct_photos(path)
    Photo.includes(:user, :tags).where(folder_path: path).order(taken_at: :desc)
  end

  # path 直下の子フォルダ（名前・可視な配下の枚数・カバー）
  def children(path)
    prefix = path == "/" ? "/" : "#{path}/"
    grouped = Photo.where("folder_path = ? OR folder_path LIKE ? ESCAPE '\\'", path, "#{escape_like(prefix)}%")
                   .group(:folder_path).count
                   .reject { |p, _| p == path }

    by_child = grouped.group_by { |descendant_path, _| child_segment(prefix, descendant_path) }

    by_child.filter_map do |segment, entries|
      child_path = "#{prefix}#{segment}"
      next unless folder_visible?(child_path)

      visible_paths = entries.map(&:first).select { |p| folder_visible?(p) }
      next if visible_paths.empty?

      count = entries.sum { |p, c| visible_paths.include?(p) ? c : 0 }
      cover = Photo.where(folder_path: visible_paths).order(taken_at: :desc).first
      Child.new(name: segment, path: child_path, photo_count: count, cover_photo: cover)
    end.sort_by(&:name)
  end

  def breadcrumb(path)
    AccessPolicy.ancestor_chain(path)
  end

  private

  def child_segment(prefix, descendant_path)
    descendant_path.delete_prefix(prefix).split("/").first
  end

  def escape_like(str)
    str.gsub(/[\\%_]/) { |c| "\\#{c}" }
  end
end
