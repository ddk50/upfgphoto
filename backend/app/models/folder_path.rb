# フォルダパス文字列のユーティリティ (ADR-003)
module FolderPath
  module_function

  def normalize(path)
    segments = path.to_s.split("/").map(&:strip).reject(&:empty?)
    raise ArgumentError, "invalid path" if segments.any? { |s| s == ".." }

    "/" + segments.join("/")
  end

  def name(path)
    path.to_s.split("/").reject(&:empty?).last || ""
  end
end
