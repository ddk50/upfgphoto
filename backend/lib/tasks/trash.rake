namespace :trash do
  desc "保持期間を過ぎたゴミ箱の写真を完全削除する (日次cron想定, ADR-022)"
  task purge: :environment do
    cutoff = Time.current - Photo::TRASH_RETENTION
    purged = 0
    skipped = 0

    # DB全体のロックは不要。1件ずつ行ロック (SELECT ... FOR UPDATE) で掴み、
    # 「まだゴミ箱にいて、かつ期限切れ」を再確認してから消す。
    # パージ実行中にユーザーが復元した場合は復元が勝つ (skip)
    Photo.trashed.where(deleted_at: ..cutoff).pluck(:id).each do |id|
      Photo.transaction do
        photo = Photo.lock.find_by(id: id)
        if photo.nil? || photo.deleted_at.nil? || photo.deleted_at > cutoff
          skipped += 1
          next
        end
        # 実ファイル・サムネイルを同期削除 (async job だとプロセス断で孤児化するため)
        photo.image.purge if photo.image.attached?
        photo.destroy!
        purged += 1
      end
    end

    puts "trash:purge 完了 — 完全削除 #{purged} 件 / スキップ (復元等) #{skipped} 件 / " \
         "カットオフ #{cutoff.iso8601} (保持 #{Photo::TRASH_RETENTION / 1.day} 日)"
  end
end
