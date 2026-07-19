# ステージングは本番と同一構成 (ADR-021)。差分は production.rb を読み込んだ上での
# 最小限のオーバーライドのみに限定し、構成ドリフトを防ぐ。
require_relative "production"

Rails.application.configure do
  # ステージングであることをログで判別できるように
  config.log_tags = [ :request_id, ->(_req) { "staging" } ]
end
