# N+1 回帰ガード用: ブロック中に発行された SQL クエリ数を数える。
# 「データ件数を増やしてもクエリ数が変わらない」ことの主張に使う
# (動作が同じままクエリ数だけ退行する変更は、通常の spec では検出できない)
module QueryCountHelpers
  def count_queries
    n = 0
    counter = lambda do |_name, _start, _finish, _id, payload|
      next if payload[:name] == "SCHEMA"
      next if payload[:sql].match?(/\A(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)/i)

      n += 1
    end
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { yield }
    n
  end
end

RSpec.configure do |config|
  config.include QueryCountHelpers, type: :request
end
